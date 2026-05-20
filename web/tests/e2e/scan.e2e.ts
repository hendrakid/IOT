/**
 * E2E tests for POST /api/scan (ESP32 entry point).
 * Requires PostgreSQL (DATABASE_URL, JWT_SECRET in .env).
 */
import request from "supertest";
import app from "../../src/index";
import { pool } from "../../src/models/db";
import bcrypt from "bcryptjs";

let token: string;
let userId: number;
let cardUid: string;
const testEmail = `scan-e2e-${Date.now()}@test.com`;

beforeAll(async () => {
  const hash = await bcrypt.hash("testpassword", 10);
  await pool.query(
    "INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = $2",
    ["testadmin", hash]
  );

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: "testadmin", password: "testpassword" });
  expect(loginRes.status).toBe(200);
  token = loginRes.body.data.token;

  const userRes = await request(app)
    .post("/api/users")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Scan E2E User", email: testEmail, access_point_ids: [1] });
  expect(userRes.status).toBe(201);
  userId = userRes.body.data.id;

  cardUid = `SCAN${Date.now()}`;
  const cardRes = await request(app)
    .post("/api/cards")
    .set("Authorization", `Bearer ${token}`)
    .send({ card_uid: cardUid, label: "Scan E2E", user_id: userId });
  expect(cardRes.status).toBe(201);
});

afterAll(async () => {
  await pool.query("DELETE FROM attendance WHERE card_uid = $1 OR card_uid LIKE 'SCAN%'", [
    cardUid,
  ]);
  await pool.query("DELETE FROM cards WHERE card_uid = $1", [cardUid]);
  await pool.query("DELETE FROM user_access_points WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  await pool.query("DELETE FROM admins WHERE username = 'testadmin'");
});

describe("POST /api/scan", () => {
  it("denies unregistered card with access_point_id", async () => {
    const uid = `UNREG${Date.now()}`;
    const res = await request(app)
      .post("/api/scan")
      .send({ uid, access_point_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.registered).toBe(false);
    expect(res.body.data.access).toBe(false);
    expect(res.body.data.checked).toBe(false);

    const { rows } = await pool.query(
      "SELECT action FROM attendance WHERE card_uid = $1 ORDER BY id DESC LIMIT 1",
      [uid]
    );
    expect(rows[0]?.action).toBe("tap");
    await pool.query("DELETE FROM attendance WHERE card_uid = $1", [uid]);
  });

  it("grants access for registered card with user access to AP 1", async () => {
    const res = await request(app)
      .post("/api/scan")
      .send({ uid: cardUid, access_point_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.registered).toBe(true);
    expect(res.body.data.access).toBe(true);
    expect(res.body.data.checked).toBe(true);
    expect(res.body.data.user_name).toBe("Scan E2E User");

    const { rows } = await pool.query(
      "SELECT action FROM attendance WHERE card_uid = $1 ORDER BY id DESC LIMIT 1",
      [cardUid]
    );
    expect(rows[0]?.action).toBe("access_granted");
  });

  it("returns checked=false when access_point_id is omitted", async () => {
    const res = await request(app)
      .post("/api/scan")
      .send({ uid: cardUid });

    expect(res.status).toBe(200);
    expect(res.body.data.registered).toBe(true);
    expect(res.body.data.access).toBe(false);
    expect(res.body.data.checked).toBe(false);
  });

  it("denies access when user has no access to the access point", async () => {
    const uid = `DENY${Date.now()}`;
    const denyEmail = `deny-${Date.now()}@test.com`;
    const userRes = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "No Access User", email: denyEmail });
    const denyUserId = userRes.body.data.id;

    await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_uid: uid, user_id: denyUserId });

    const res = await request(app)
      .post("/api/scan")
      .send({ uid, access_point_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.registered).toBe(true);
    expect(res.body.data.access).toBe(false);
    expect(res.body.data.checked).toBe(true);

    const { rows } = await pool.query(
      "SELECT action FROM attendance WHERE card_uid = $1 ORDER BY id DESC LIMIT 1",
      [uid]
    );
    expect(rows[0]?.action).toBe("access_denied");

    await pool.query("DELETE FROM attendance WHERE card_uid = $1", [uid]);
    await pool.query("DELETE FROM cards WHERE card_uid = $1", [uid]);
    await pool.query("DELETE FROM users WHERE id = $1", [denyUserId]);
  });

  it("returns 400 for empty body", async () => {
    const res = await request(app).post("/api/scan").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Validation failed");
  });
});

describe("POST /api/scan rate limit (app limiter)", () => {
  const prevMax = process.env.SCAN_RATE_LIMIT_MAX;

  afterAll(() => {
    if (prevMax === undefined) delete process.env.SCAN_RATE_LIMIT_MAX;
    else process.env.SCAN_RATE_LIMIT_MAX = prevMax;
  });

  it("returns 429 after exceeding SCAN_RATE_LIMIT_MAX", async () => {
    process.env.SCAN_RATE_LIMIT_MAX = "2";
    let limitedApp: typeof app;
    jest.isolateModules(() => {
      limitedApp = require("../../src/index").default;
    });

    const uid = `RL${Date.now()}`;
    const body = { uid, access_point_id: 1 };

    expect((await request(limitedApp!).post("/api/scan").send(body)).status).toBe(200);
    expect((await request(limitedApp!).post("/api/scan").send(body)).status).toBe(200);
    const blocked = await request(limitedApp!).post("/api/scan").send(body);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("Too many requests");
    await pool.query("DELETE FROM attendance WHERE card_uid = $1", [uid]);
  });
});

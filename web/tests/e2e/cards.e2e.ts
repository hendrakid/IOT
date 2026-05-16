/**
 * E2E tests for the Cards API flow.
 *
 * These tests require a real PostgreSQL database.
 * Set DATABASE_URL and JWT_SECRET in .env before running.
 *
 * Run with: npm run test:e2e
 */
import request from "supertest";
import app from "../../src/index";
import { pool } from "../../src/models/db";
import bcrypt from "bcryptjs";

let token: string;
let createdUserId: number;
let createdCardId: number;

beforeAll(async () => {
  // Seed an admin account
  const hash = await bcrypt.hash("testpassword", 10);
  await pool.query(
    "INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = $2",
    ["testadmin", hash]
  );

  // Login to get JWT
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "testadmin", password: "testpassword" });

  expect(res.status).toBe(200);
  token = res.body.data.token;
});

afterAll(async () => {
  // Clean up test data
  await pool.query("DELETE FROM admins WHERE username = 'testadmin'");
  if (createdUserId) {
    await pool.query("DELETE FROM users WHERE id = $1", [createdUserId]);
  }
  await pool.end();
});

describe("POST /api/users", () => {
  it("creates a new user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "E2E Test User", email: `e2e-${Date.now()}@test.com` });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("E2E Test User");
    createdUserId = res.body.data.id;
  });

  it("rejects duplicate email", async () => {
    const email = `dup-${Date.now()}@test.com`;
    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "User A", email });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "User B", email });

    expect(res.status).toBe(409);
  });
});

describe("POST /api/cards", () => {
  it("registers a card for a user", async () => {
    const uid = `TEST${Date.now()}`;
    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_uid: uid, label: "E2E Card", user_id: createdUserId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card_uid).toBe(uid.toUpperCase());
    createdCardId = res.body.data.id;
  });

  it("rejects duplicate UID", async () => {
    const uid = `DUP${Date.now()}`;
    await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_uid: uid, user_id: createdUserId });

    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_uid: uid, user_id: createdUserId });

    expect(res.status).toBe(409);
  });

  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/cards")
      .send({ card_uid: "NOAUTH", user_id: createdUserId });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/cards", () => {
  it("returns paginated card list", async () => {
    const res = await request(app)
      .get("/api/cards?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
  });
});

describe("DELETE /api/cards/:id", () => {
  it("deletes a card", async () => {
    const res = await request(app)
      .delete(`/api/cards/${createdCardId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 for non-existent card", async () => {
    const res = await request(app)
      .delete("/api/cards/999999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/attendance", () => {
  it("logs attendance from ESP32 (no auth needed)", async () => {
    const res = await request(app)
      .post("/api/attendance")
      .send({ card_uid: "UNREGISTERED_CARD" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.access).toBe(false); // unregistered = access_denied
  });
});

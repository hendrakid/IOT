/**
 * E2E tests for MQTT → DB → hardware SSE.
 * Requires PostgreSQL, Mosquitto (docker compose up -d), MQTT_URL in .env.
 * Skipped when MQTT_URL is unset.
 */
import request from "supertest";
import http from "http";
import bcrypt from "bcryptjs";
import { pool } from "../../src/models/db";
import { startMqttSubscriber } from "../../src/utils/mqttSubscriber";
import { runStaleStatusTick } from "../../src/utils/staleStatusJob";

const mqttUrl = process.env.MQTT_URL?.trim();
const describeMqtt = mqttUrl ? describe : describe.skip;

describeMqtt("MQTT hardware E2E", () => {
  jest.setTimeout(20_000);

  let app: typeof import("../../src/index").default;
  let server: http.Server;
  let baseUrl: string;
  let token: string;
  let mqttReady: Promise<void>;
  let mqttClient: ReturnType<typeof startMqttSubscriber>;
  const apId = 1;
  const testFirmware = `e2e-${Date.now()}`;

  beforeAll(async () => {
    const { default: appModule } = await import("../../src/index");
    app = appModule;
    mqttClient = startMqttSubscriber();
    if (!mqttClient) {
      throw new Error("MQTT subscriber failed to start — set MQTT_URL in .env");
    }
    const client = mqttClient;
    mqttReady = new Promise((resolve) => {
      if (client.connected) {
        resolve();
        return;
      }
      client.once("connect", () => resolve());
    });
    await mqttReady;
    await new Promise((r) => setTimeout(r, 500));

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    const hash = await bcrypt.hash("testpassword", 10);
    await pool.query(
      "INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = $2",
      ["mqtttestadmin", hash]
    );
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "mqtttestadmin", password: "testpassword" });
    token = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM access_point_status WHERE access_point_id = $1", [apId]);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM access_point_status WHERE access_point_id = $1", [apId]);
    await pool.query("DELETE FROM admins WHERE username = 'mqtttestadmin'");
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  async function pollStatus(
    predicate: (row: Record<string, unknown>) => boolean,
    attempts = 25,
    delayMs = 400
  ): Promise<Record<string, unknown>> {
    for (let i = 0; i < attempts; i++) {
      const { rows } = await pool.query(
        `SELECT access_point_id, online, firmware_version, last_seen_at
         FROM access_point_status WHERE access_point_id = $1`,
        [apId]
      );
      if (rows[0] && predicate(rows[0] as Record<string, unknown>)) {
        return rows[0] as Record<string, unknown>;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const { rows: debugRows } = await pool.query(
      "SELECT * FROM access_point_status WHERE access_point_id = $1",
      [apId]
    );
    throw new Error(
      `pollStatus: condition not met; rows=${JSON.stringify(debugRows)}`
    );
  }

  it("persists telemetry from MQTT message through subscriber handler", async () => {
    const { processMqttMessage } = await import("../../src/utils/mqttSubscriber");
    const topic = `smartlock/ap/${apId}/telemetry`;
    const payload = {
      access_point_id: apId,
      online: true,
      status: "online",
      ip_address: "192.168.1.99",
      mac_address: "AA:BB:CC:DD:EE:01",
      firmware_version: testFirmware,
      battery_percent: 88,
      signal_dbm: -55,
      core_temp_c: 40.5,
    };
    await processMqttMessage(topic, Buffer.from(JSON.stringify(payload)));
    const row = await pollStatus(
      (r) => r.online === true && r.firmware_version === testFirmware
    );
    expect(row.access_point_id).toBe(apId);
    expect(row.online).toBe(true);
  });

  it("marks node offline via stale status tick", async () => {
    // beforeEach cleared status; insert stale row for this case only
    await pool.query(
      `INSERT INTO access_point_status (access_point_id, online, last_seen_at, updated_at)
       VALUES ($1, true, NOW() - INTERVAL '10 minutes', NOW())
       ON CONFLICT (access_point_id) DO UPDATE SET
         online = true,
         last_seen_at = NOW() - INTERVAL '10 minutes',
         updated_at = NOW()`,
      [apId]
    );

    await runStaleStatusTick(1);

    const row = await pollStatus((r) => r.online === false, 10, 200);
    expect(row.online).toBe(false);
  });

  it("returns 401 for hardware stream without token", async () => {
    const res = await request(app).get("/api/hardware/stream");
    expect(res.status).toBe(401);
  });

  it("returns SSE snapshot with valid JWT token", async () => {
    const body = await new Promise<string>((resolve, reject) => {
      const req = http.get(
        `${baseUrl}/api/hardware/stream?token=${encodeURIComponent(token)}`,
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`SSE status ${res.statusCode}`));
            return;
          }
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("data:")) {
              res.destroy();
              resolve(data);
            }
          });
          res.on("error", reject);
        }
      );
      req.on("error", reject);
      setTimeout(() => {
        req.destroy();
        reject(new Error("SSE read timeout"));
      }, 10_000);
    });

    const dataLine = body.split("\n").find((l) => l.startsWith("data:"));
    expect(dataLine).toBeDefined();
    const parsed = JSON.parse(dataLine!.replace(/^data:\s*/, ""));
    expect(parsed.type).toBe("snapshot");
    expect(Array.isArray(parsed.data)).toBe(true);
  });
});

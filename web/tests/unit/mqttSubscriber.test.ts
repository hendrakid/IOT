import { processMqttMessage } from "../../src/utils/mqttSubscriber";
import { pool } from "../../src/models/db";

const apId = 1;
const testFirmware = `unit-mqtt-${Date.now()}`;

afterAll(async () => {
  await pool.query("DELETE FROM access_point_status WHERE access_point_id = $1", [apId]);
});

describe("processMqttMessage", () => {
  it("upserts access_point_status from telemetry payload", async () => {
    const topic = `smartlock/ap/${apId}/telemetry`;
    const payload = {
      access_point_id: apId,
      online: true,
      status: "online",
      firmware_version: testFirmware,
      signal_dbm: -58,
    };

    await processMqttMessage(topic, Buffer.from(JSON.stringify(payload)));

    const { rows } = await pool.query(
      "SELECT online, firmware_version FROM access_point_status WHERE access_point_id = $1",
      [apId]
    );
    expect(rows[0]?.online).toBe(true);
    expect(rows[0]?.firmware_version).toBe(testFirmware);
  });
});

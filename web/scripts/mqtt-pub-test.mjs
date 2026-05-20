/**
 * Publish a sample telemetry message to verify server MQTT subscriber + DB.
 * Usage: node scripts/mqtt-pub-test.mjs [access_point_id]
 */
import mqtt from "mqtt";

const url = process.env.MQTT_URL ?? "mqtt://localhost:1883";
const apId = Number(process.argv[2] ?? "1");
const topic = `smartlock/ap/${apId}/telemetry`;

const payload = {
  access_point_id: apId,
  online: true,
  status: "online",
  ip_address: "192.168.1.50",
  mac_address: "AA:BB:CC:DD:EE:FF",
  firmware_version: "1.0.0-test",
  battery_percent: 90,
  signal_dbm: -62,
  core_temp_c: 42.0,
};

const client = mqtt.connect(url, { connectTimeout: 5000 });

const timeout = setTimeout(() => {
  console.error("[mqtt-pub-test] Timeout — is the broker running?");
  client.end(true);
  process.exit(1);
}, 8000);

function done(code) {
  clearTimeout(timeout);
  client.end(true, () => process.exit(code));
}

client.on("connect", () => {
  client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
    if (err) {
      console.error("[mqtt-pub-test] Publish failed:", err.message);
      done(1);
      return;
    }
    console.log("[mqtt-pub-test] Published to", topic);
    console.log(JSON.stringify(payload, null, 2));
    done(0);
  });
});

client.on("error", (err) => {
  console.error("[mqtt-pub-test] Connection error:", err.message);
  console.error("Hint: run `docker compose up -d` from repo root, then retry.");
  done(1);
});

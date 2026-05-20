/**
 * Verify access_point_status row after MQTT test publish.
 * Usage: node scripts/verify-mqtt-status.mjs [access_point_id]
 */
import "dotenv/config";
import pg from "pg";

const apId = Number(process.argv[2] ?? "1");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query(
  `SELECT access_point_id, online, last_seen_at, firmware_version, signal_dbm
   FROM access_point_status WHERE access_point_id = $1`,
  [apId]
);

if (!rows[0]) {
  console.error(`[verify] No status row for access_point_id=${apId}. Is the server subscribed to MQTT?`);
  process.exit(1);
}

console.log("[verify] access_point_status:", rows[0]);
if (rows[0].firmware_version !== "1.0.0-test") {
  console.warn("[verify] firmware_version mismatch — expected 1.0.0-test from mqtt:test");
}
await pool.end();

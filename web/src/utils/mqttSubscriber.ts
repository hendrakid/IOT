import mqtt, { MqttClient } from "mqtt";
import { upsertAccessPointStatus } from "../models/accessPointStatus";
import { broadcastHardwareEvent } from "./hardwareBroadcast";

type ParsedTelemetry = {
  access_point_id: number;
  online?: boolean;
  ip_address?: string | null;
  mac_address?: string | null;
  firmware_version?: string | null;
  battery_percent?: number | null;
  signal_dbm?: number | null;
  core_temp_c?: number | null;
};

function parseAccessPointIdFromTopic(topic: string): number | null {
  // Expected patterns:
  // - smartlock/ap/<id>/telemetry
  // - smartlock/ap/<id>/status
  const parts = topic.split("/").filter(Boolean);
  const apIdx = parts.findIndex((p) => p === "ap");
  if (apIdx < 0) return null;
  const idRaw = parts[apIdx + 1];
  const id = Number(idRaw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function safeJsonParse(buf: Buffer): unknown {
  try {
    return JSON.parse(buf.toString("utf-8"));
  } catch {
    return null;
  }
}

function normalizePayload(topic: string, payload: unknown): ParsedTelemetry | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  const access_point_id =
    typeof obj.access_point_id === "number"
      ? obj.access_point_id
      : parseAccessPointIdFromTopic(topic);
  if (!access_point_id) return null;

  const online =
    typeof obj.online === "boolean"
      ? obj.online
      : typeof obj.status === "string"
        ? obj.status.toLowerCase() === "online"
        : undefined;

  const toNumOrNull = (v: unknown): number | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const toStrOrNull = (v: unknown): string | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    return String(v);
  };

  return {
    access_point_id,
    online,
    ip_address: toStrOrNull(obj.ip_address),
    mac_address: toStrOrNull(obj.mac_address),
    firmware_version: toStrOrNull(obj.firmware_version),
    battery_percent: toNumOrNull(obj.battery_percent),
    signal_dbm: toNumOrNull(obj.signal_dbm),
    core_temp_c: toNumOrNull(obj.core_temp_c),
  };
}

function formatMqttError(err: unknown): string {
  if (!err || typeof err !== "object") return String(err);
  const e = err as { message?: string; code?: string; errno?: number };
  return e.message || e.code || String(err);
}

export function startMqttSubscriber(): MqttClient | null {
  const url = process.env.MQTT_URL?.trim();
  const telemetryTopic = process.env.MQTT_TELEMETRY_TOPIC ?? "smartlock/ap/+/telemetry";
  const statusTopic = process.env.MQTT_STATUS_TOPIC ?? "smartlock/ap/+/status";

  if (!url) {
    console.log("[mqtt] MQTT_URL not set; subscriber disabled");
    return null;
  }

  if (process.env.MQTT_ENABLED === "false") {
    console.log("[mqtt] MQTT_ENABLED=false; subscriber disabled");
    return null;
  }

  const connectOpts: Parameters<typeof mqtt.connect>[1] = {
    reconnectPeriod: 10_000,
    connectTimeout: 10_000,
  };
  if (process.env.MQTT_USERNAME) connectOpts.username = process.env.MQTT_USERNAME;
  if (process.env.MQTT_PASSWORD) connectOpts.password = process.env.MQTT_PASSWORD;

  const client = mqtt.connect(url, connectOpts);

  let lastErrorLog = 0;

  client.on("connect", () => {
    console.log("[mqtt] Connected to", url);
    client.subscribe([telemetryTopic, statusTopic], (err) => {
      if (err) console.error("[mqtt] Subscribe error:", formatMqttError(err));
      else console.log("[mqtt] Subscribed:", telemetryTopic, statusTopic);
    });
  });

  client.on("error", (err) => {
    const now = Date.now();
    if (now - lastErrorLog < 30_000) return;
    lastErrorLog = now;

    const detail = formatMqttError(err);
    console.error("[mqtt] Error:", detail || "(no message)");
    console.error(
      "[mqtt] Hint: pastikan broker MQTT berjalan di",
      url,
      "(mis. Mosquitto). Atau hapus MQTT_URL / set MQTT_ENABLED=false di .env untuk menonaktifkan."
    );
  });

  client.on("message", async (topic, message) => {
    const parsed = safeJsonParse(message);
    const normalized = normalizePayload(topic, parsed);
    if (!normalized) return;

    try {
    const nowIso = new Date().toISOString();
    const status = await upsertAccessPointStatus({
      access_point_id: normalized.access_point_id,
      online: normalized.online ?? true,
      last_seen_at: nowIso,
      ip_address: normalized.ip_address ?? null,
      mac_address: normalized.mac_address ?? null,
      firmware_version: normalized.firmware_version ?? null,
      battery_percent:
        typeof normalized.battery_percent === "number"
          ? Math.max(0, Math.min(100, Math.round(normalized.battery_percent)))
          : normalized.battery_percent ?? null,
      signal_dbm:
        typeof normalized.signal_dbm === "number" ? Math.round(normalized.signal_dbm) : normalized.signal_dbm ?? null,
      core_temp_c:
        typeof normalized.core_temp_c === "number" ? normalized.core_temp_c : normalized.core_temp_c ?? null,
    });

    broadcastHardwareEvent({
      type: "status",
      data: status,
    });
    } catch (err) {
      console.error("[mqtt] Failed to persist status:", formatMqttError(err));
    }
  });

  return client;
}


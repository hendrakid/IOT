import { markStaleAccessPointsOffline } from "../models/accessPointStatus";
import { broadcastHardwareEvent } from "./hardwareBroadcast";

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_THRESHOLD_SEC = 120;

export function startStaleStatusJob(): NodeJS.Timeout | null {
  if (process.env.MQTT_ENABLED === "false") return null;
  if (!process.env.MQTT_URL?.trim()) return null;

  const intervalMs = parseInt(
    process.env.STALE_STATUS_INTERVAL_MS ?? String(DEFAULT_INTERVAL_MS),
    10
  );
  const thresholdSec = parseInt(
    process.env.STALE_STATUS_THRESHOLD_SEC ?? String(DEFAULT_THRESHOLD_SEC),
    10
  );

  const tick = () => runStaleStatusTick(thresholdSec);

  const timer = setInterval(() => void tick(), intervalMs);
  void tick();
  console.log(
    `[stale-status] Started (every ${intervalMs}ms, threshold ${thresholdSec}s)`
  );
  return timer;
}

/** Run one stale-offline pass (exported for tests). */
export async function runStaleStatusTick(
  thresholdSec = parseInt(
    process.env.STALE_STATUS_THRESHOLD_SEC ?? String(DEFAULT_THRESHOLD_SEC),
    10
  )
): Promise<void> {
  try {
    const updated = await markStaleAccessPointsOffline(thresholdSec);
    for (const status of updated) {
      broadcastHardwareEvent({ type: "status", data: status });
    }
    if (updated.length > 0) {
      console.log(
        `[stale-status] Marked ${updated.length} access point(s) offline (>${thresholdSec}s)`
      );
    }
  } catch (err) {
    console.error("[stale-status] Job error:", err);
  }
}

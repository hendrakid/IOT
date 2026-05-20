import { pool } from "./db";

export type AccessPointStatus = {
  access_point_id: number;
  online: boolean;
  last_seen_at: string | null;
  ip_address: string | null;
  mac_address: string | null;
  firmware_version: string | null;
  battery_percent: number | null;
  signal_dbm: number | null;
  core_temp_c: number | null;
  updated_at: string;
};

export type AccessPointStatusSnapshot = {
  id: number;
  name: string;
  type: string;
  location: string | null;
  created_at: string;
  status: AccessPointStatus | null;
};

export async function upsertAccessPointStatus(
  status: Omit<AccessPointStatus, "updated_at">
): Promise<AccessPointStatus> {
  const {
    access_point_id,
    online,
    last_seen_at,
    ip_address,
    mac_address,
    firmware_version,
    battery_percent,
    signal_dbm,
    core_temp_c,
  } = status;

  const { rows } = await pool.query<AccessPointStatus>(
    `INSERT INTO access_point_status (
       access_point_id, online, last_seen_at, ip_address, mac_address, firmware_version,
       battery_percent, signal_dbm, core_temp_c, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
     ON CONFLICT (access_point_id) DO UPDATE SET
       online = EXCLUDED.online,
       last_seen_at = EXCLUDED.last_seen_at,
       ip_address = EXCLUDED.ip_address,
       mac_address = EXCLUDED.mac_address,
       firmware_version = EXCLUDED.firmware_version,
       battery_percent = EXCLUDED.battery_percent,
       signal_dbm = EXCLUDED.signal_dbm,
       core_temp_c = EXCLUDED.core_temp_c,
       updated_at = NOW()
     RETURNING access_point_id, online, last_seen_at, ip_address, mac_address, firmware_version,
               battery_percent, signal_dbm, core_temp_c, updated_at`,
    [
      access_point_id,
      online,
      last_seen_at,
      ip_address,
      mac_address,
      firmware_version,
      battery_percent,
      signal_dbm,
      core_temp_c,
    ]
  );

  return rows[0]!;
}

export async function getAccessPointStatusSnapshots(): Promise<AccessPointStatusSnapshot[]> {
  const { rows } = await pool.query<
    {
      id: number;
      name: string;
      type: string;
      location: string | null;
      created_at: string;
    } & Partial<AccessPointStatus>
  >(
    `SELECT ap.id, ap.name, ap.type, ap.location, ap.created_at,
            s.access_point_id, s.online, s.last_seen_at, s.ip_address, s.mac_address,
            s.firmware_version, s.battery_percent, s.signal_dbm, s.core_temp_c, s.updated_at
     FROM access_points ap
     LEFT JOIN access_point_status s ON s.access_point_id = ap.id
     ORDER BY ap.id ASC`
  );

  return rows.map((r) => mapRowToSnapshot(r));
}

function mapRowToSnapshot(
  r: {
    id: number;
    name: string;
    type: string;
    location: string | null;
    created_at: string;
  } & Partial<AccessPointStatus>
): AccessPointStatusSnapshot {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    location: r.location,
    created_at: r.created_at,
    status: r.access_point_id
      ? {
          access_point_id: r.access_point_id,
          online: !!r.online,
          last_seen_at: r.last_seen_at ?? null,
          ip_address: (r.ip_address as unknown as string | null) ?? null,
          mac_address: r.mac_address ?? null,
          firmware_version: r.firmware_version ?? null,
          battery_percent:
            typeof r.battery_percent === "number" ? r.battery_percent : null,
          signal_dbm: typeof r.signal_dbm === "number" ? r.signal_dbm : null,
          core_temp_c: typeof r.core_temp_c === "number" ? r.core_temp_c : null,
          updated_at: r.updated_at!,
        }
      : null,
  };
}

/** Mark nodes offline when last_seen_at is older than thresholdSeconds. */
export async function markStaleAccessPointsOffline(
  thresholdSeconds = 120
): Promise<AccessPointStatus[]> {
  const { rows } = await pool.query<AccessPointStatus>(
    `UPDATE access_point_status
     SET online = false, updated_at = NOW()
     WHERE online = true
       AND (
         last_seen_at IS NULL
         OR last_seen_at < NOW() - make_interval(secs => $1::double precision)
       )
     RETURNING access_point_id, online, last_seen_at, ip_address, mac_address,
               firmware_version, battery_percent, signal_dbm, core_temp_c, updated_at`,
    [thresholdSeconds]
  );
  return rows;
}


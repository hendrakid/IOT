CREATE TABLE IF NOT EXISTS access_point_status (
  access_point_id  INTEGER PRIMARY KEY REFERENCES access_points(id) ON DELETE CASCADE,
  online           BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at     TIMESTAMPTZ NULL,
  ip_address       INET NULL,
  mac_address      TEXT NULL,
  firmware_version TEXT NULL,
  battery_percent  INTEGER NULL CHECK (battery_percent >= 0 AND battery_percent <= 100),
  signal_dbm       INTEGER NULL,
  core_temp_c      REAL NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_point_status_last_seen_at
  ON access_point_status (last_seen_at DESC);


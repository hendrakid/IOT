ALTER TABLE access_point_status
  ADD COLUMN IF NOT EXISTS power_source TEXT NULL
    CHECK (power_source IN ('battery', 'adapter'));
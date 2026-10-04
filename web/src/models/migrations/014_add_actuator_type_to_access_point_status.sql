ALTER TABLE access_point_status
  ADD COLUMN IF NOT EXISTS actuator_type TEXT NULL
    CHECK (actuator_type IN ('relay', 'servo'));
-- Add access point reference to attendance logs for filtering and reporting
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS access_point_id INTEGER REFERENCES access_points(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_access_point_id ON attendance(access_point_id);

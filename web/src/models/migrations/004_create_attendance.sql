-- 004_create_attendance.sql
-- Attendance log sent by ESP32 after each card tap

CREATE TABLE IF NOT EXISTS attendance (
  id         SERIAL PRIMARY KEY,
  card_uid   VARCHAR(50)  NOT NULL,
  user_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(20)  NOT NULL DEFAULT 'tap',  -- e.g. 'tap', 'access_granted', 'access_denied'
  timestamp  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_card_uid  ON attendance(card_uid);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);

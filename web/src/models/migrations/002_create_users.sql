-- 002_create_users.sql
-- Users who own RFID cards (employees / students)

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  role       VARCHAR(50)  NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

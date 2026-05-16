-- 001_create_admins.sql
-- Admin accounts for the web dashboard

CREATE TABLE IF NOT EXISTS admins (
  id        SERIAL PRIMARY KEY,
  username  VARCHAR(50)  NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,         -- bcrypt hash
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

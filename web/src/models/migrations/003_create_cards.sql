-- 003_create_cards.sql
-- RFID cards. One user can own many cards (1:N).
-- card_uid is stored as UPPERCASE hex string, e.g. "ABCD1234"

CREATE TABLE IF NOT EXISTS cards (
  id         SERIAL PRIMARY KEY,
  card_uid   VARCHAR(50)  NOT NULL UNIQUE,  -- uppercase hex UID from MFRC522
  label      VARCHAR(100) NOT NULL DEFAULT '',
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_card_uid ON cards(card_uid);
CREATE INDEX IF NOT EXISTS idx_cards_user_id  ON cards(user_id);

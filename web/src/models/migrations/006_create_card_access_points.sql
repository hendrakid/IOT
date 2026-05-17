-- Migration: Create card_access_points table
CREATE TABLE IF NOT EXISTS card_access_points (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    access_point_id INTEGER NOT NULL REFERENCES access_points(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES admins(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(card_id, access_point_id)
);
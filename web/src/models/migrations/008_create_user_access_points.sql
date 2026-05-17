-- Migration: Create user_access_points table
-- Assign access rights to users instead of cards
CREATE TABLE IF NOT EXISTS user_access_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_point_id INTEGER NOT NULL REFERENCES access_points(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES admins(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, access_point_id)
);

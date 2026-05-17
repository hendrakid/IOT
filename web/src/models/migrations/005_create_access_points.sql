-- Migration: Create access_points table
CREATE TABLE IF NOT EXISTS access_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL, -- e.g. 'door', 'lift', etc.
    location VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
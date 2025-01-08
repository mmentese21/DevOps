-- init.sql
CREATE TABLE IF NOT EXISTS names (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(first_name, last_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_names_created_at ON names(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_names_full_name ON names(first_name, last_name);

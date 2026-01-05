-- ===========================================
-- Nexus Project Hub - Database Initialization
-- ===========================================
-- This script runs automatically when PostgreSQL container starts
-- It runs AFTER the POSTGRES_DB database is created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create schemas
CREATE SCHEMA IF NOT EXISTS nexus;

-- Grant permissions to the nexus user
GRANT ALL ON SCHEMA nexus TO nexus;
GRANT ALL ON ALL TABLES IN SCHEMA nexus TO nexus;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nexus TO nexus;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA nexus GRANT ALL ON TABLES TO nexus;
ALTER DEFAULT PRIVILEGES IN SCHEMA nexus GRANT ALL ON SEQUENCES TO nexus;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE '✅ Nexus Project Hub database initialized successfully!';
END $$;

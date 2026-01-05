-- ===========================================
-- Nexus Project Hub - Database Initialization
-- ===========================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create schemas
CREATE SCHEMA IF NOT EXISTS nexus;

-- Set default search path
ALTER DATABASE nexus_project_hub SET search_path TO nexus, public;

-- Grant permissions
GRANT ALL ON SCHEMA nexus TO nexus;
GRANT ALL ON ALL TABLES IN SCHEMA nexus TO nexus;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nexus TO nexus;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Nexus Project Hub database initialized successfully!';
END $$;

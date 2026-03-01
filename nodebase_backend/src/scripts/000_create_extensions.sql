-- ============================================================
-- 000_create_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- trigram-based text search (future use)
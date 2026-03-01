-- ============================================================
-- 001_create_enums.sql
-- Custom enum types used across multiple tables
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_type') THEN
    CREATE TYPE node_type AS ENUM (
      'INITIAL',
      'MANUAL_TRIGGER',
      'HTTP_REQUEST',
      'GOOGLE_FORM_TRIGGER',
      'STRIPE_TRIGGER',
      'ANTHROPIC',
      'GEMINI',
      'OPENAI',
      'DISCORD',
      'SLACK'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credential_type') THEN
    CREATE TYPE credential_type AS ENUM (
      'OPENAI',
      'ANTHROPIC',
      'GEMINI'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'execution_status') THEN
    CREATE TYPE execution_status AS ENUM (
      'RUNNING',
      'SUCCESS',
      'FAILED'
    );
  END IF;
END
$$;
-- ============================================================
-- 003_create_sessions.sql
-- Sessions table for auth token management
-- ============================================================

CREATE TABLE IF NOT EXISTS "session" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  expires_at  TIMESTAMPTZ NOT NULL,
  token       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address  TEXT,
  user_agent  TEXT,
  user_id     TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

-- ── Unique constraint ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_token_unique'
  ) THEN
    ALTER TABLE "session" ADD CONSTRAINT session_token_unique UNIQUE (token);
  END IF;
END $$;

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_token ON "session" (token);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON "session" (user_id);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_session_updated_at ON "session";

CREATE TRIGGER trg_session_updated_at
  BEFORE UPDATE ON "session"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_own_data ON "session";

CREATE POLICY sessions_own_data ON "session"
  USING (user_id = current_setting('app.current_user_id', true)::text);
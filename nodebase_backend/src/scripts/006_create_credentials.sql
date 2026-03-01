-- ============================================================
-- 006_create_credentials.sql
-- User credentials for third-party API keys (encrypted at rest)
-- ============================================================

CREATE TABLE IF NOT EXISTS "credential" (
  id          TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT            NOT NULL,
  value       TEXT            NOT NULL,
  type        credential_type NOT NULL,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  user_id     TEXT            NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON "credential" (user_id);

CREATE INDEX IF NOT EXISTS idx_credentials_type    ON "credential" (type);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_credential_updated_at ON "credential";

CREATE TRIGGER trg_credential_updated_at
  BEFORE UPDATE ON "credential"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "credential" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credentials_own_data ON "credential";

CREATE POLICY credentials_own_data ON "credential"
  USING (user_id = current_setting('app.current_user_id', true)::text);
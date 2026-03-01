-- ============================================================
-- 004_create_accounts.sql
-- OAuth / provider accounts linked to users
-- ============================================================

CREATE TABLE IF NOT EXISTS "account" (
  id                      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id              TEXT        NOT NULL,
  provider_id             TEXT        NOT NULL,
  user_id                 TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  access_token            TEXT,
  refresh_token           TEXT,
  id_token                TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope                   TEXT,
  password                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON "account" (user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_provider_id ON "account" (provider_id);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_account_updated_at ON "account";

CREATE TRIGGER trg_account_updated_at
  BEFORE UPDATE ON "account"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounts_own_data ON "account";

CREATE POLICY accounts_own_data ON "account"
  USING (user_id = current_setting('app.current_user_id', true)::text);
-- ============================================================
-- 002_create_users.sql
-- Users table + updated_at trigger function (reused by all tables)
-- ============================================================

-- ── Reusable trigger function: auto-set updated_at ──────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user" (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  email_verified BOOLEAN    NOT NULL DEFAULT false,
  image         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Unique constraint ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_email_unique'
  ) THEN
    ALTER TABLE "user" ADD CONSTRAINT user_email_unique UNIQUE (email);
  END IF;
END $$;

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON "user" (email);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_user_updated_at ON "user";

CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_own_data ON "user";

CREATE POLICY users_own_data ON "user"
  USING (id = current_setting('app.current_user_id', true)::text);
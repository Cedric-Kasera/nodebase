-- ============================================================
-- 005_create_verifications.sql
-- Verification tokens (email verification, password reset, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS "verification" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier  TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON "verification" (identifier);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_verification_updated_at ON "verification";

CREATE TRIGGER trg_verification_updated_at
  BEFORE UPDATE ON "verification"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();
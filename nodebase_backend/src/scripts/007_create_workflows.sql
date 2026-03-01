-- ============================================================
-- 007_create_workflows.sql
-- Workflows owned by users
-- ============================================================

CREATE TABLE IF NOT EXISTS "workflow" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON "workflow" (user_id);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_workflow_updated_at ON "workflow";

CREATE TRIGGER trg_workflow_updated_at
  BEFORE UPDATE ON "workflow"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "workflow" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflows_own_data ON "workflow";

CREATE POLICY workflows_own_data ON "workflow"
  USING (user_id = current_setting('app.current_user_id', true)::text);
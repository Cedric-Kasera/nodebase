-- ============================================================
-- 010_create_executions.sql
-- Workflow execution records
-- ============================================================

CREATE TABLE IF NOT EXISTS "execution" (
  id                TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workflow_id       TEXT              NOT NULL REFERENCES "workflow" (id) ON DELETE CASCADE,
  status            execution_status  NOT NULL DEFAULT 'RUNNING',
  error             TEXT,
  error_stack       TEXT,
  started_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  trigger_event_id  TEXT              UNIQUE,
  output            JSONB
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id      ON "execution" (workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status           ON "execution" (status);
CREATE INDEX IF NOT EXISTS idx_executions_trigger_event_id ON "execution" (trigger_event_id);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "execution" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS executions_own_data ON "execution";
CREATE POLICY executions_own_data ON "execution"
  USING (
    EXISTS (
      SELECT 1 FROM "workflow"
      WHERE "workflow".id = "execution".workflow_id
        AND "workflow".user_id = current_setting('app.current_user_id', true)::text
    )
  );

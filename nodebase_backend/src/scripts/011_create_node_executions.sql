-- ─── Per-node execution tracking ────────────────────────────

CREATE TABLE IF NOT EXISTS "node_execution" (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    execution_id TEXT NOT NULL REFERENCES "execution" (id) ON DELETE CASCADE,
    node_id TEXT NOT NULL REFERENCES "node" (id) ON DELETE CASCADE,
    status execution_status NOT NULL DEFAULT 'RUNNING',
    output JSONB,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast look-ups: all node results for one execution, ordered by start time
CREATE INDEX IF NOT EXISTS idx_node_execution_execution ON "node_execution" (execution_id, started_at ASC);

-- Fast look-ups by node
CREATE INDEX IF NOT EXISTS idx_node_execution_node ON "node_execution" (node_id);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE "node_execution" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS node_execution_owner ON "node_execution";

CREATE POLICY node_execution_owner ON "node_execution"
  USING (
    execution_id IN (
      SELECT e.id FROM "execution" e
      JOIN "workflow" w ON w.id = e.workflow_id
      WHERE w.user_id = current_setting('app.current_user_id', true)::text
    )
  );
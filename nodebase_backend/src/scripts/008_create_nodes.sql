-- ============================================================
-- 008_create_nodes.sql
-- Nodes within workflows
-- ============================================================

CREATE TABLE IF NOT EXISTS "node" (
  id            TEXT      PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workflow_id   TEXT      NOT NULL REFERENCES "workflow" (id) ON DELETE CASCADE,
  name          TEXT      NOT NULL,
  type          node_type NOT NULL,
  position      JSONB     NOT NULL,
  data          JSONB     NOT NULL DEFAULT '{}',
  credential_id TEXT      REFERENCES "credential" (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nodes_workflow_id ON "node" (workflow_id);

CREATE INDEX IF NOT EXISTS idx_nodes_credential_id ON "node" (credential_id);

CREATE INDEX IF NOT EXISTS idx_nodes_type          ON "node" (type);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_node_updated_at ON "node";

CREATE TRIGGER trg_node_updated_at
  BEFORE UPDATE ON "node"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "node" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nodes_own_data ON "node";

CREATE POLICY nodes_own_data ON "node"
  USING (
    EXISTS (
      SELECT 1 FROM "workflow"
      WHERE "workflow".id = "node".workflow_id
        AND "workflow".user_id = current_setting('app.current_user_id', true)::text
    )
  );
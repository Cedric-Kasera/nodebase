-- ============================================================
-- 009_create_connections.sql
-- Edges between nodes in a workflow
-- ============================================================

CREATE TABLE IF NOT EXISTS "connection" (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workflow_id   TEXT        NOT NULL REFERENCES "workflow" (id) ON DELETE CASCADE,
  from_node_id  TEXT        NOT NULL REFERENCES "node" (id) ON DELETE CASCADE,
  to_node_id    TEXT        NOT NULL REFERENCES "node" (id) ON DELETE CASCADE,
  from_output   TEXT        NOT NULL DEFAULT 'main',
  to_input      TEXT        NOT NULL DEFAULT 'main',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Unique constraint ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connection_edge_unique'
  ) THEN
    ALTER TABLE "connection" ADD CONSTRAINT connection_edge_unique
      UNIQUE (from_node_id, to_node_id, from_output, to_input);
  END IF;
END $$;

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_connections_workflow_id ON "connection" (workflow_id);

CREATE INDEX IF NOT EXISTS idx_connections_from_node_id ON "connection" (from_node_id);

CREATE INDEX IF NOT EXISTS idx_connections_to_node_id ON "connection" (to_node_id);

-- ── Trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_connection_updated_at ON "connection";

CREATE TRIGGER trg_connection_updated_at
  BEFORE UPDATE ON "connection"
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE "connection" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS connections_own_data ON "connection";

CREATE POLICY connections_own_data ON "connection"
  USING (
    EXISTS (
      SELECT 1 FROM "workflow"
      WHERE "workflow".id = "connection".workflow_id
        AND "workflow".user_id = current_setting('app.current_user_id', true)::text
    )
  );
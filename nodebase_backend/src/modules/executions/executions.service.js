import { query } from "../../config/db.js";
import AppError from "../../utils/api-error.js";
import { PAGINATION } from "../../config/constants.js";
import withTransaction from "../../utils/transaction.js";
import logger from "../../utils/logger.js";

/**
 * List executions for a user's workflows (paginated).
 */
export const getExecutions = async (
  userId,
  {
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = {},
) => {
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT e.id, e.workflow_id, e.status, e.started_at, e.completed_at, e.trigger_event_id,
              w.name AS workflow_name
       FROM "execution" e
       JOIN "workflow" w ON w.id = e.workflow_id
       WHERE w.user_id = $1
       ORDER BY e.started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset],
    ),
    query(
      `SELECT COUNT(*) FROM "execution" e JOIN "workflow" w ON w.id = e.workflow_id WHERE w.user_id = $1`,
      [userId],
    ),
  ]);

  return {
    executions: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    pageSize,
  };
};

/**
 * Get a single execution with its output.
 */
export const getExecutionById = async (executionId, userId) => {
  const result = await query(
    `SELECT e.* FROM "execution" e
     JOIN "workflow" w ON w.id = e.workflow_id
     WHERE e.id = $1 AND w.user_id = $2`,
    [executionId, userId],
  );
  if (result.rows.length === 0) throw new AppError("Execution not found", 404);
  return result.rows[0];
};

// ─── Write Operations ──────────────────────────────────────────────

/**
 * Create a new execution row (status defaults to RUNNING).
 * Called when POST /api/workflows/:id/execute fires.
 */
export const createExecution = async (userId, workflowId) => {
  const execution = await withTransaction(userId, async (client) => {
    const result = await client.query(
      `INSERT INTO "execution" (workflow_id, started_at)
       VALUES ($1, now())
       RETURNING id, workflow_id, status, started_at`,
      [workflowId],
    );
    return result.rows[0];
  });

  logger.info("Execution created", { executionId: execution.id, workflowId });
  return execution;
};

/**
 * Update an execution's status, output, and error fields.
 */
export const updateExecution = async (
  executionId,
  status,
  output = null,
  error = null,
  errorStack = null,
) => {
  await query(
    `UPDATE "execution"
     SET status = $2,
         output = $3,
         error = $4,
         error_stack = $5,
         completed_at = now()
     WHERE id = $1`,
    [
      executionId,
      status,
      output ? JSON.stringify(output) : null,
      error,
      errorStack,
    ],
  );
  logger.info("Execution updated", { executionId, status });
};

// ─── Node Execution Tracking ───────────────────────────────────────

/**
 * Record the start of a single node execution.
 */
export const createNodeExecution = async (executionId, nodeId) => {
  const result = await query(
    `INSERT INTO "node_execution" (execution_id, node_id, started_at)
     VALUES ($1, $2, now())
     RETURNING id`,
    [executionId, nodeId],
  );
  return result.rows[0];
};

/**
 * Record the completion (or failure) of a node execution.
 */
export const updateNodeExecution = async (
  executionId,
  nodeId,
  status,
  output = null,
  error = null,
) => {
  await query(
    `UPDATE "node_execution"
     SET status = $3,
         output = $4,
         error = $5,
         completed_at = now()
     WHERE execution_id = $1 AND node_id = $2`,
    [
      executionId,
      nodeId,
      status,
      output ? JSON.stringify(output) : null,
      error,
    ],
  );
};

/**
 * Get all node executions for a given execution (for the detail view).
 */
export const getNodeExecutions = async (executionId) => {
  const result = await query(
    `SELECT id, node_id, status, output, error, started_at, completed_at
     FROM "node_execution"
     WHERE execution_id = $1
     ORDER BY started_at ASC`,
    [executionId],
  );
  return result.rows;
};

import { query } from "../../config/db.js";
import AppError from "../../utils/api-error.js";
import withTransaction from "../../utils/transaction.js";
import logger from "../../utils/logger.js";

/**
 * Create a connection between two nodes in a workflow.
 */
export const createConnection = async (
  workflowId,
  userId,
  { fromNodeId, toNodeId, fromOutput, toInput },
) => {
  const connection = await withTransaction(userId, async (client) => {
    // Verify workflow ownership
    const wf = await client.query(
      'SELECT id FROM "workflow" WHERE id = $1 AND user_id = $2 LIMIT 1',
      [workflowId, userId],
    );
    if (wf.rows.length === 0) throw new AppError("Workflow not found", 404);

    const result = await client.query(
      `INSERT INTO "connection" (workflow_id, from_node_id, to_node_id, from_output, to_input)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workflow_id, from_node_id, to_node_id, from_output, to_input, created_at`,
      [
        workflowId,
        fromNodeId,
        toNodeId,
        fromOutput || "main",
        toInput || "main",
      ],
    );
    return result.rows[0];
  });

  logger.info("Connection created", {
    connectionId: connection.id,
    workflowId,
  });
  return connection;
};

/**
 * Delete a connection.
 */
export const removeConnection = async (connectionId, userId) => {
  await withTransaction(userId, async (client) => {
    const ownership = await client.query(
      `SELECT c.id FROM "connection" c JOIN "workflow" w ON w.id = c.workflow_id WHERE c.id = $1 AND w.user_id = $2 LIMIT 1`,
      [connectionId, userId],
    );
    if (ownership.rows.length === 0)
      throw new AppError("Connection not found", 404);

    await client.query('DELETE FROM "connection" WHERE id = $1', [
      connectionId,
    ]);
  });

  logger.info("Connection deleted", { connectionId });
  return { id: connectionId };
};

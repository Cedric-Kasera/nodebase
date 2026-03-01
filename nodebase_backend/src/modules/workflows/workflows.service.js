import { query } from "../../config/db.js";
import AppError from "../../utils/api-error.js";
import { PAGINATION } from "../../config/constants.js";
import withTransaction from "../../utils/transaction.js";
import logger from "../../utils/logger.js";

/**
 * List all workflows for a user (paginated).
 */
export const getWorkflows = async (
  userId,
  {
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = {},
) => {
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT id, name, created_at, updated_at FROM "workflow" WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset],
    ),
    query('SELECT COUNT(*) FROM "workflow" WHERE user_id = $1', [userId]),
  ]);

  return {
    workflows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    pageSize,
  };
};

/**
 * Get a single workflow with its nodes and connections.
 */
export const getWorkflowById = async (workflowId, userId) => {
  const result = await query(
    'SELECT id, name, created_at, updated_at FROM "workflow" WHERE id = $1 AND user_id = $2',
    [workflowId, userId],
  );
  if (result.rows.length === 0) {
    throw new AppError("Workflow not found", 404);
  }

  const workflow = result.rows[0];

  const [nodesResult, connectionsResult] = await Promise.all([
    query(
      `SELECT id, name, type, position, data, credential_id, created_at, updated_at FROM "node" WHERE workflow_id = $1 ORDER BY created_at ASC`,
      [workflowId],
    ),
    query(
      `SELECT id, from_node_id, to_node_id, from_output, to_input FROM "connection" WHERE workflow_id = $1`,
      [workflowId],
    ),
  ]);

  return {
    ...workflow,
    nodes: nodesResult.rows,
    connections: connectionsResult.rows,
  };
};

/**
 * Create a new workflow.
 */
export const createWorkflow = async (userId, { name }) => {
  const workflow = await withTransaction(userId, async (client) => {
    const result = await client.query(
      `INSERT INTO "workflow" (name, user_id) VALUES ($1, $2) RETURNING id, name, created_at, updated_at`,
      [name, userId],
    );
    return result.rows[0];
  });

  logger.info("Workflow created", { workflowId: workflow.id });
  return workflow;
};

/**
 * Update workflow name.
 */
export const updateWorkflowName = async (workflowId, userId, { name }) => {
  const workflow = await withTransaction(userId, async (client) => {
    const result = await client.query(
      `UPDATE "workflow" SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name, updated_at`,
      [name, workflowId, userId],
    );
    if (result.rows.length === 0) {
      throw new AppError("Workflow not found", 404);
    }
    return result.rows[0];
  });

  logger.info("Workflow name updated", { workflowId });
  return workflow;
};

/**
 * Save the full workflow graph (nodes + connections) in a single transaction.
 * Deletes all existing nodes/connections and re-inserts the provided ones.
 */
export const saveWorkflow = async (
  workflowId,
  userId,
  { nodes, connections },
) => {
  const workflow = await withTransaction(userId, async (client) => {
    // Verify ownership
    const wfResult = await client.query(
      'SELECT id FROM "workflow" WHERE id = $1 AND user_id = $2',
      [workflowId, userId],
    );
    if (wfResult.rows.length === 0) {
      throw new AppError("Workflow not found", 404);
    }

    // Wipe existing graph (connections first due to FK)
    await client.query('DELETE FROM "connection" WHERE workflow_id = $1', [
      workflowId,
    ]);
    await client.query('DELETE FROM "node" WHERE workflow_id = $1', [
      workflowId,
    ]);

    // Insert nodes
    for (const n of nodes) {
      await client.query(
        `INSERT INTO "node" (id, workflow_id, name, type, position, data, credential_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          n.id,
          workflowId,
          n.name || "",
          n.type,
          JSON.stringify(n.position),
          JSON.stringify(n.data || {}),
          n.credential_id || null,
        ],
      );
    }

    // Insert connections
    for (const c of connections) {
      await client.query(
        `INSERT INTO "connection" (id, workflow_id, from_node_id, to_node_id, from_output, to_input)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          c.id,
          workflowId,
          c.from_node_id,
          c.to_node_id,
          c.from_output || "main",
          c.to_input || "main",
        ],
      );
    }

    // Touch updated_at
    await client.query(
      'UPDATE "workflow" SET updated_at = now() WHERE id = $1 RETURNING id, name, created_at, updated_at',
      [workflowId],
    );

    return wfResult.rows[0];
  });

  // Return the full graph after save
  const saved = await getWorkflowById(workflowId, userId);
  logger.info("Workflow saved", {
    workflowId,
    nodeCount: nodes.length,
    connectionCount: connections.length,
  });
  return saved;
};

/**
 * Delete a workflow.
 */
export const removeWorkflow = async (workflowId, userId) => {
  await withTransaction(userId, async (client) => {
    const result = await client.query(
      `DELETE FROM "workflow" WHERE id = $1 AND user_id = $2 RETURNING id`,
      [workflowId, userId],
    );
    if (result.rows.length === 0) {
      throw new AppError("Workflow not found", 404);
    }
  });

  logger.info("Workflow deleted", { workflowId });
  return { id: workflowId };
};

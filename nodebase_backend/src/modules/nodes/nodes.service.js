import { query } from "../../config/db.js";
import AppError from "../../utils/api-error.js";
import withTransaction from "../../utils/transaction.js";
import logger from "../../utils/logger.js";

/**
 * Create a node inside a workflow.
 */
export const createNode = async (
  workflowId,
  userId,
  { name, type, position, data, credentialId },
) => {
  const node = await withTransaction(userId, async (client) => {
    // Verify workflow ownership
    const wf = await client.query(
      'SELECT id FROM "workflow" WHERE id = $1 AND user_id = $2 LIMIT 1',
      [workflowId, userId],
    );
    if (wf.rows.length === 0) throw new AppError("Workflow not found", 404);

    const result = await client.query(
      `INSERT INTO "node" (workflow_id, name, type, position, data, credential_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, workflow_id, name, type, position, data, credential_id, created_at, updated_at`,
      [
        workflowId,
        name,
        type,
        JSON.stringify(position),
        JSON.stringify(data || {}),
        credentialId || null,
      ],
    );
    return result.rows[0];
  });

  logger.info("Node created", { nodeId: node.id, workflowId });
  return node;
};

/**
 * Update a node.
 */
export const updateNode = async (nodeId, userId, updates) => {
  const node = await withTransaction(userId, async (client) => {
    // Verify ownership through workflow
    const ownership = await client.query(
      `SELECT n.id FROM "node" n JOIN "workflow" w ON w.id = n.workflow_id WHERE n.id = $1 AND w.user_id = $2 LIMIT 1`,
      [nodeId, userId],
    );
    if (ownership.rows.length === 0) throw new AppError("Node not found", 404);

    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.position !== undefined) {
      fields.push(`position = $${idx++}`);
      values.push(JSON.stringify(updates.position));
    }
    if (updates.data !== undefined) {
      fields.push(`data = $${idx++}`);
      values.push(JSON.stringify(updates.data));
    }
    if (updates.credentialId !== undefined) {
      fields.push(`credential_id = $${idx++}`);
      values.push(updates.credentialId);
    }

    if (fields.length === 0) throw new AppError("No fields to update", 400);

    values.push(nodeId);
    const result = await client.query(
      `UPDATE "node" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, workflow_id, name, type, position, data, credential_id, updated_at`,
      values,
    );
    return result.rows[0];
  });

  logger.info("Node updated", { nodeId });
  return node;
};

/**
 * Delete a node.
 */
export const removeNode = async (nodeId, userId) => {
  await withTransaction(userId, async (client) => {
    const ownership = await client.query(
      `SELECT n.id FROM "node" n JOIN "workflow" w ON w.id = n.workflow_id WHERE n.id = $1 AND w.user_id = $2 LIMIT 1`,
      [nodeId, userId],
    );
    if (ownership.rows.length === 0) throw new AppError("Node not found", 404);

    await client.query('DELETE FROM "node" WHERE id = $1', [nodeId]);
  });

  logger.info("Node deleted", { nodeId });
  return { id: nodeId };
};

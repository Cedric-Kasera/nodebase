import { query } from "../../config/db.js";
import AppError from "../../utils/api-error.js";
import { PAGINATION } from "../../config/constants.js";
import withTransaction from "../../utils/transaction.js";
import logger from "../../utils/logger.js";
import { encrypt, decrypt } from "../../utils/encryption.js";

/**
 * List all credentials for a user (paginated).
 */
export const getCredentials = async (
  userId,
  {
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = {},
) => {
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT id, name, type, created_at, updated_at FROM "credential" WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset],
    ),
    query('SELECT COUNT(*) FROM "credential" WHERE user_id = $1', [userId]),
  ]);

  return {
    credentials: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    pageSize,
  };
};

/**
 * Get a single credential by ID (value excluded for safety — only returned on explicit request).
 */
export const getCredentialById = async (credentialId, userId) => {
  const result = await query(
    'SELECT id, name, type, created_at, updated_at FROM "credential" WHERE id = $1 AND user_id = $2',
    [credentialId, userId],
  );
  if (result.rows.length === 0) throw new AppError("Credential not found", 404);
  return result.rows[0];
};

/**
 * Get credentials by type for a user.
 */
export const getCredentialsByType = async (type, userId) => {
  const result = await query(
    'SELECT id, name, type, created_at, updated_at FROM "credential" WHERE type = $1 AND user_id = $2 ORDER BY created_at DESC',
    [type, userId],
  );
  return result.rows;
};

/**
 * Create a credential.
 */
export const createCredential = async (userId, { name, value, type }) => {
  const encryptedValue = encrypt(value);
  const credential = await withTransaction(userId, async (client) => {
    const result = await client.query(
      `INSERT INTO "credential" (name, value, type, user_id) VALUES ($1, $2, $3, $4)
       RETURNING id, name, type, created_at, updated_at`,
      [name, encryptedValue, type, userId],
    );
    return result.rows[0];
  });

  logger.info("Credential created", { credentialId: credential.id, type });
  return credential;
};

/**
 * Update a credential.
 */
export const updateCredential = async (
  credentialId,
  userId,
  { name, value },
) => {
  const credential = await withTransaction(userId, async (client) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (value !== undefined) {
      fields.push(`value = $${idx++}`);
      values.push(encrypt(value));
    }

    if (fields.length === 0) throw new AppError("No fields to update", 400);

    values.push(credentialId, userId);
    const result = await client.query(
      `UPDATE "credential" SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING id, name, type, updated_at`,
      values,
    );
    if (result.rows.length === 0)
      throw new AppError("Credential not found", 404);
    return result.rows[0];
  });

  logger.info("Credential updated", { credentialId });
  return credential;
};

/**
 * Delete a credential.
 */
export const removeCredential = async (credentialId, userId) => {
  await withTransaction(userId, async (client) => {
    const result = await client.query(
      'DELETE FROM "credential" WHERE id = $1 AND user_id = $2 RETURNING id',
      [credentialId, userId],
    );
    if (result.rows.length === 0)
      throw new AppError("Credential not found", 404);
  });

  logger.info("Credential deleted", { credentialId });
  return { id: credentialId };
};

/**
 * For the execution engine: fetch and decrypt credential values for
 * every node in a workflow that has a credential_id.
 *
 * @param {Array} nodes  – node rows (must include id and credential_id)
 * @param {string} userId
 * @returns {Object} – { [nodeId]: decryptedPlaintext }
 */
export const getCredentialsForWorkflow = async (nodes, userId) => {
  const nodesWithCred = nodes.filter((n) => n.credential_id);
  if (nodesWithCred.length === 0) return {};

  const credIds = [...new Set(nodesWithCred.map((n) => n.credential_id))];

  // Fetch raw (encrypted) values — only for this user
  const placeholders = credIds.map((_, i) => `$${i + 2}`).join(", ");
  const result = await query(
    `SELECT id, value FROM "credential" WHERE id IN (${placeholders}) AND user_id = $1`,
    [userId, ...credIds],
  );

  const credMap = Object.fromEntries(
    result.rows.map((r) => [r.id, decrypt(r.value)]),
  );

  // Map nodeId → decrypted credential value
  const out = {};
  for (const node of nodesWithCred) {
    out[node.id] = credMap[node.credential_id] ?? null;
  }
  return out;
};

import { getClient } from "../config/db.js";
import logger from "./logger.js";

/**
 * Execute a callback inside a database transaction with optional RLS enforcement.
 *
 * When `userId` is provided, sets `SET LOCAL app.current_user_id` so that
 * PostgreSQL Row-Level Security policies are enforced for every query
 * within the transaction.
 *
 * @param {string|null} userId  The authenticated user's ID (null to skip RLS)
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 * @template T
 */
export const withTransaction = async (userId, callback) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Enforce RLS by setting the current user for this transaction
    if (userId) {
      await client.query(
        `SET LOCAL app.current_user_id = ${client.escapeLiteral(String(userId))}`,
      );
    }

    const result = await callback(client);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Transaction rolled back", {
      userId: userId || "none",
      error: err.message,
    });
    throw err;
  } finally {
    client.release();
  }
};

export default withTransaction;

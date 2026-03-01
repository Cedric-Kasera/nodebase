import { query } from "../../config/db.js";
import AppError from "../../utils/api-error.js";
import logger from "../../utils/logger.js";

/**
 * Get user profile by ID.
 */
export const getUserById = async (userId) => {
  const result = await query(
    'SELECT id, name, email, email_verified, image, created_at, updated_at FROM "user" WHERE id = $1 LIMIT 1',
    [userId],
  );
  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }
  return result.rows[0];
};

/**
 * Update user profile.
 */
export const updateUser = async (userId, { name, image }) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (image !== undefined) {
    fields.push(`image = $${idx++}`);
    values.push(image);
  }

  if (fields.length === 0) {
    throw new AppError("No fields to update", 400);
  }

  values.push(userId);
  const result = await query(
    `UPDATE "user" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, image, updated_at`,
    values,
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  logger.info("User profile updated", { userId });
  return result.rows[0];
};

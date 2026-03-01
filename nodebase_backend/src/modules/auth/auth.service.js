import { query } from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import AppError from "../../utils/api-error.js";
import withTransaction from "../../utils/transaction.js";
import logger from "../../utils/logger.js";

const SALT_ROUNDS = 12;

/**
 * Register a new user with email + password.
 */
export const register = async ({ name, email, password }) => {
  // Check if email already taken (pre-flight, outside transaction)
  const existing = await query(
    'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
    [email],
  );
  if (existing.rows.length > 0) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Transaction: create user + account atomically
  const { user, token } = await withTransaction(null, async (client) => {
    const userResult = await client.query(
      `INSERT INTO "user" (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at`,
      [name, email],
    );
    const newUser = userResult.rows[0];

    await client.query(
      `INSERT INTO "account" (account_id, provider_id, user_id, password) VALUES ($1, $2, $3, $4)`,
      [newUser.id, "credential", newUser.id, hashedPassword],
    );

    const jwt = generateToken(newUser);
    return { user: newUser, token: jwt };
  });

  logger.info("User registered", { userId: user.id });
  return { user, token };
};

/**
 * Log in with email + password.
 */
export const login = async ({ email, password }) => {
  // Fetch user + credential in parallel for speed
  const userResult = await query(
    'SELECT id, name, email FROM "user" WHERE email = $1 LIMIT 1',
    [email],
  );
  if (userResult.rows.length === 0) {
    throw new AppError("Invalid email or password", 401);
  }
  const user = userResult.rows[0];

  const accountResult = await query(
    `SELECT password FROM "account" WHERE user_id = $1 AND provider_id = 'credential' LIMIT 1`,
    [user.id],
  );
  if (accountResult.rows.length === 0 || !accountResult.rows[0].password) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, accountResult.rows[0].password);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user);

  logger.info("User logged in", { userId: user.id });
  return { user, token };
};

/**
 * Generate a signed JWT for the given user.
 */
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

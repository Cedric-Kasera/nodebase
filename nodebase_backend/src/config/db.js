import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err);
  process.exit(-1);
});

/**
 * Execute a single query.
 * @param {string} text  SQL query string
 * @param {any[]}  params  Parameterised values
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool for transactions.
 * Always release the client in a finally block.
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = () => pool.connect();

export default pool;

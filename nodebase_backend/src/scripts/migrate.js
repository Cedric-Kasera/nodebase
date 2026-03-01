/**
 * migrate.js — reads all .sql files in src/scripts/ in lexicographic order
 * and executes them sequentially against the database.
 *
 * Usage: node src/scripts/migrate.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const scriptsDir = __dirname;

  // Collect and sort .sql files
  const files = fs
    .readdirSync(scriptsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`\n🗂  Found ${files.length} migration file(s):\n`);

  const client = await pool.connect();

  try {
    for (const file of files) {
      const filePath = path.join(scriptsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`  ▶  Running ${file} …`);
      await client.query(sql);
      console.log(`  ✔  ${file} done.`);
    }

    console.log("\n✅ All migrations completed successfully.\n");
  } catch (err) {
    console.error(`\n❌ Migration failed:`, err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

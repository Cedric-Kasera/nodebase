import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

  // CORS
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // Inngest
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,

  get isDev() {
    return this.NODE_ENV === "development";
  },
  get isProd() {
    return this.NODE_ENV === "production";
  },
};

// Validate critical env vars at startup
const required = ["DATABASE_URL", "JWT_SECRET", "ENCRYPTION_KEY", "INNGEST_EVENT_KEY"];
for (const key of required) {
  if (!env[key]) {
    console.warn(`Warning: Environment variable ${key} is not set.`);
  }
}

export default env;

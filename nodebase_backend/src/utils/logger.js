import env from "../config/env.js";

// ─── Sensitive keys to redact in logged objects
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "access_token",
  "refresh_token",
  "id_token",
  "creditcard",
  "jwt_secret",
  "database_url",
  "value", // credential values
]);

/**
 * Deep-clone an object and replace sensitive field values with "[REDACTED]".
 */
function redact(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) return obj.map(redact);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      clean[key] = redact(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

// ─── Log levels
const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const CURRENT_LEVEL = env.isDev ? LEVELS.debug : LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta) {
  const base = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(redact(meta))}`;
  }
  return base;
}

// ─── Logger

const logger = {
  error(message, meta = {}) {
    if (CURRENT_LEVEL >= LEVELS.error) {
      console.error(formatMessage("error", message, meta));
    }
  },

  warn(message, meta = {}) {
    if (CURRENT_LEVEL >= LEVELS.warn) {
      console.warn(formatMessage("warn", message, meta));
    }
  },

  info(message, meta = {}) {
    if (CURRENT_LEVEL >= LEVELS.info) {
      console.log(formatMessage("info", message, meta));
    }
  },

  http(message, meta = {}) {
    if (CURRENT_LEVEL >= LEVELS.http) {
      console.log(formatMessage("http", message, meta));
    }
  },

  debug(message, meta = {}) {
    if (CURRENT_LEVEL >= LEVELS.debug) {
      console.log(formatMessage("debug", message, meta));
    }
  },

  /** Redact an object (useful externally). */
  redact,
};

export default logger;

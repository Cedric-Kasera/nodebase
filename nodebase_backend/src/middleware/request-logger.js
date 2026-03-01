import logger from "../utils/logger.js";

/**
 * Express middleware that logs every incoming request and its response.
 *
 * Logs:
 *  - Incoming: method, path, IP
 *  - Outgoing: method, path, status code, response time, authenticated userId
 *
 * Does NOT log response bodies to avoid leaking sensitive data.
 */
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  // Log incoming request
  logger.http(`→ ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
  });

  // Capture response finish
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    logger.http(`← ${req.method} ${req.originalUrl} ${res.statusCode}`, {
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.id || "anonymous",
    });
  });

  next();
};

export default requestLogger;

import env from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Global error-handling middleware.
 * Express recognises it by the 4-argument signature.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal Server Error";

  // Log the error without leaking sensitive details to the client
  logger.error(`${statusCode} — ${message}`, {
    stack: env.isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDev && { stack: err.stack }),
  });
};

export default errorHandler;

/**
 * Wraps an async route handler so thrown errors are forwarded to next().
 * @param {Function} fn  Async (req, res, next) => Promise<void>
 * @returns {Function}
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;

import jwt from "jsonwebtoken";
import env from "../config/env.js";
import AppError from "../utils/api-error.js";

/**
 * Middleware that verifies the JWT from the `token` cookie.
 * On success, attaches `req.user = { id, email }` and calls next().
 */
const verifyToken = (req, _res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please log in again.", 401));
    }
    return next(new AppError("Invalid token. Please log in again.", 401));
  }
};

export default verifyToken;

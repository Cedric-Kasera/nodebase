import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";

// Middleware
import requestLogger from "./middleware/request-logger.js";
import notFound from "./middleware/not-found.js";
import errorHandler from "./middleware/error-handler.js";

// Module routers
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import workflowsRoutes from "./modules/workflows/workflows.routes.js";
import nodesRoutes from "./modules/nodes/nodes.routes.js";
import connectionsRoutes from "./modules/connections/connections.routes.js";
import credentialsRoutes from "./modules/credentials/credentials.routes.js";
import executionsRoutes from "./modules/executions/executions.routes.js";
import webhooksRoutes from "./modules/webhooks/webhooks.routes.js";
import { inngestServe } from "./inngest/serve.js";

const app = express();

// ─── Global middleware

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// HTTP request & response logging (replaces morgan)
app.use(requestLogger);

// ─── Rate limiting

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

// ─── Routes ───────

// Health & root
app.get("/", (_req, res) => {
  res.json({ message: "Nodebase API", version: "1.0.0" });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Webhook routes (no auth — called by external services like Google Forms, Stripe)
app.use("/api/webhooks", webhooksRoutes);

// Module routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/workflows", workflowsRoutes);
app.use("/api/nodes", nodesRoutes);
app.use("/api/connections", connectionsRoutes);
app.use("/api/credentials", credentialsRoutes);
app.use("/api/executions", executionsRoutes);

// Inngest webhook endpoint
app.use("/api/inngest", inngestServe);

// ─── Error handling and 404

app.use(notFound);
app.use(errorHandler);

export default app;

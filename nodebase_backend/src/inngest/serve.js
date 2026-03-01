import { serve } from "inngest/express";
import { inngest } from "./client.js";
import { executeWorkflow } from "./functions/execute-workflow.js";

/**
 * Express middleware that exposes the Inngest webhook endpoint.
 * Mount at: app.use("/api/inngest", inngestServe);
 */
export const inngestServe = serve({
  client: inngest,
  functions: [executeWorkflow],
});

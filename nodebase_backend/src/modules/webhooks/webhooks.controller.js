import { query } from "../../config/db.js";
import * as executionsService from "../executions/executions.service.js";
import { inngest } from "../../inngest/client.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";
import AppError from "../../utils/api-error.js";
import logger from "../../utils/logger.js";

/**
 * Look up a workflow and its owner by workflow ID.
 * Used by webhook handlers (no auth token available).
 */
const getWorkflowOwner = async (workflowId) => {
  const result = await query(
    'SELECT id, user_id FROM "workflow" WHERE id = $1',
    [workflowId],
  );
  if (result.rows.length === 0) {
    throw new AppError("Workflow not found", 404);
  }
  return result.rows[0];
};

/**
 * Shared helper: create an execution and fire the Inngest event
 * with the trigger payload attached.
 */
const triggerWorkflowExecution = async (workflowId, userId, triggerPayload) => {
  const execution = await executionsService.createExecution(
    userId,
    workflowId,
  );

  await inngest.send({
    name: "workflow/execute",
    data: {
      executionId: execution.id,
      workflowId,
      userId,
      triggerPayload,
    },
  });

  logger.info("Webhook triggered workflow execution", {
    workflowId,
    executionId: execution.id,
  });

  return execution;
};

/**
 * POST /api/webhooks/google-form?workflowId=...
 * Called by Google Forms (via Apps Script) on submission.
 */
export const handleGoogleFormWebhook = catchAsync(async (req, res) => {
  const { workflowId } = req.query;
  if (!workflowId) {
    throw new AppError("workflowId query parameter is required", 400);
  }

  const workflow = await getWorkflowOwner(workflowId);

  const execution = await triggerWorkflowExecution(
    workflow.id,
    workflow.user_id,
    {
      source: "google-form",
      formData: req.body,
      receivedAt: new Date().toISOString(),
    },
  );

  ApiResponse.success(
    res,
    { executionId: execution.id },
    "Workflow execution triggered",
    202,
  );
});

/**
 * POST /api/webhooks/stripe?workflowId=...
 * Called by Stripe when an event fires.
 */
export const handleStripeWebhook = catchAsync(async (req, res) => {
  const { workflowId } = req.query;
  if (!workflowId) {
    throw new AppError("workflowId query parameter is required", 400);
  }

  const workflow = await getWorkflowOwner(workflowId);

  const execution = await triggerWorkflowExecution(
    workflow.id,
    workflow.user_id,
    {
      source: "stripe",
      event: req.body,
      receivedAt: new Date().toISOString(),
    },
  );

  ApiResponse.success(
    res,
    { executionId: execution.id },
    "Workflow execution triggered",
    202,
  );
});

import * as workflowsService from "./workflows.service.js";
import * as executionsService from "../executions/executions.service.js";
import { inngest } from "../../inngest/client.js";
import { sseManager } from "../executions/sse.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";

export const getWorkflows = catchAsync(async (req, res) => {
  const { page, pageSize } = req.query;
  const data = await workflowsService.getWorkflows(req.user.id, {
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
  });
  ApiResponse.success(res, data);
});

export const getWorkflow = catchAsync(async (req, res) => {
  const workflow = await workflowsService.getWorkflowById(
    req.params.id,
    req.user.id,
  );
  ApiResponse.success(res, { workflow });
});

export const createWorkflow = catchAsync(async (req, res) => {
  const workflow = await workflowsService.createWorkflow(req.user.id, req.body);
  ApiResponse.success(res, { workflow }, "Workflow created", 201);
});

export const updateWorkflowName = catchAsync(async (req, res) => {
  const workflow = await workflowsService.updateWorkflowName(
    req.params.id,
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { workflow }, "Workflow name updated");
});

export const saveWorkflow = catchAsync(async (req, res) => {
  const workflow = await workflowsService.saveWorkflow(
    req.params.id,
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { workflow }, "Workflow saved");
});

export const removeWorkflow = catchAsync(async (req, res) => {
  await workflowsService.removeWorkflow(req.params.id, req.user.id);
  ApiResponse.success(res, null, "Workflow deleted");
});

/**
 * POST /api/workflows/:id/execute
 * Creates an execution row, fires an Inngest event, returns immediately.
 */
export const executeWorkflow = catchAsync(async (req, res) => {
  // Verify ownership
  await workflowsService.getWorkflowById(req.params.id, req.user.id);

  // Create the execution row (RUNNING)
  const execution = await executionsService.createExecution(
    req.user.id,
    req.params.id,
  );

  // Fire the Inngest event — actual execution happens in the background
  await inngest.send({
    name: "workflow/execute",
    data: {
      executionId: execution.id,
      workflowId: req.params.id,
      userId: req.user.id,
    },
  });

  ApiResponse.success(res, { execution }, "Workflow execution started", 202);
});

/**
 * GET /api/workflows/:id/stream — workflow-level SSE.
 * Lets an open editor know when any execution starts on this workflow
 * (e.g. triggered by a webhook rather than the Execute button).
 */
export const streamWorkflow = catchAsync(async (req, res) => {
  // Verify ownership
  await workflowsService.getWorkflowById(req.params.id, req.user.id);

  const workflowId = req.params.id;

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ workflowId })}\n\n`);

  sseManager.addWorkflow(workflowId, res);

  // Clean up when the client disconnects
  req.on("close", () => {
    sseManager.removeWorkflow(workflowId, res);
  });
});

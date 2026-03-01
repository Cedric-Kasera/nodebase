import * as executionsService from "./executions.service.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";
import { sseManager } from "./sse.js";

export const getExecutions = catchAsync(async (req, res) => {
  const { page, pageSize } = req.query;
  const data = await executionsService.getExecutions(req.user.id, {
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
  });
  ApiResponse.success(res, data);
});

export const getExecution = catchAsync(async (req, res) => {
  const execution = await executionsService.getExecutionById(
    req.params.id,
    req.user.id,
  );
  ApiResponse.success(res, { execution });
});

/**
 * GET /api/executions/:id/nodes — per-node execution details
 */
export const getNodeExecutions = catchAsync(async (req, res) => {
  // Verify the user owns this execution first
  await executionsService.getExecutionById(req.params.id, req.user.id);
  const nodeExecutions = await executionsService.getNodeExecutions(
    req.params.id,
  );
  ApiResponse.success(res, { nodeExecutions });
});

/**
 * GET /api/executions/:id/stream — SSE endpoint for real-time updates.
 */
export const streamExecution = catchAsync(async (req, res) => {
  // Verify the user owns this execution
  await executionsService.getExecutionById(req.params.id, req.user.id);

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial connected event
  res.write(
    `event: connected\ndata: ${JSON.stringify({ executionId: req.params.id })}\n\n`,
  );

  // Register this response with the SSE manager
  sseManager.add(req.params.id, res);

  // Clean up on client disconnect
  req.on("close", () => {
    sseManager.remove(req.params.id, res);
  });
});

import * as nodesService from "./nodes.service.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";

export const createNode = catchAsync(async (req, res) => {
  const node = await nodesService.createNode(
    req.params.workflowId,
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { node }, "Node created", 201);
});

export const updateNode = catchAsync(async (req, res) => {
  const node = await nodesService.updateNode(
    req.params.id,
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { node }, "Node updated");
});

export const removeNode = catchAsync(async (req, res) => {
  await nodesService.removeNode(req.params.id, req.user.id);
  ApiResponse.success(res, null, "Node deleted");
});

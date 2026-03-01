import * as connectionsService from "./connections.service.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";

export const createConnection = catchAsync(async (req, res) => {
  const connection = await connectionsService.createConnection(
    req.params.workflowId,
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { connection }, "Connection created", 201);
});

export const removeConnection = catchAsync(async (req, res) => {
  await connectionsService.removeConnection(req.params.id, req.user.id);
  ApiResponse.success(res, null, "Connection deleted");
});

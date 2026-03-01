import * as credentialsService from "./credentials.service.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";

export const getCredentials = catchAsync(async (req, res) => {
  const { page, pageSize } = req.query;
  const data = await credentialsService.getCredentials(req.user.id, {
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
  });
  ApiResponse.success(res, data);
});

export const getCredential = catchAsync(async (req, res) => {
  const credential = await credentialsService.getCredentialById(
    req.params.id,
    req.user.id,
  );
  ApiResponse.success(res, { credential });
});

export const getCredentialsByType = catchAsync(async (req, res) => {
  const credentials = await credentialsService.getCredentialsByType(
    req.params.type,
    req.user.id,
  );
  ApiResponse.success(res, { credentials });
});

export const createCredential = catchAsync(async (req, res) => {
  const credential = await credentialsService.createCredential(
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { credential }, "Credential created", 201);
});

export const updateCredential = catchAsync(async (req, res) => {
  const credential = await credentialsService.updateCredential(
    req.params.id,
    req.user.id,
    req.body,
  );
  ApiResponse.success(res, { credential }, "Credential updated");
});

export const removeCredential = catchAsync(async (req, res) => {
  await credentialsService.removeCredential(req.params.id, req.user.id);
  ApiResponse.success(res, null, "Credential deleted");
});

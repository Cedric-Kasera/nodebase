import * as usersService from "./users.service.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";

export const getMe = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.user.id);
  ApiResponse.success(res, { user });
});

export const updateMe = catchAsync(async (req, res) => {
  const user = await usersService.updateUser(req.user.id, req.body);
  ApiResponse.success(res, { user }, "Profile updated");
});

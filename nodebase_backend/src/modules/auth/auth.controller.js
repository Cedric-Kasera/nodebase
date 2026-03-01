import * as authService from "./auth.service.js";
import catchAsync from "../../utils/catch-async.js";
import ApiResponse from "../../utils/api-response.js";
import env from "../../config/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.cookie("token", token, COOKIE_OPTIONS);
  ApiResponse.success(res, { user }, "Registration successful", 201);
});

export const login = catchAsync(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.cookie("token", token, COOKIE_OPTIONS);
  ApiResponse.success(res, { user }, "Login successful");
});

export const logout = catchAsync(async (_req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  ApiResponse.success(res, null, "Logged out successfully");
});

export const me = catchAsync(async (req, res) => {
  ApiResponse.success(res, { user: req.user });
});

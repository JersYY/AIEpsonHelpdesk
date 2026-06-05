import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { AuthService } from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const data = await AuthService.register(req.body);
  return sendSuccess(res, data, 201);
});

export const login = asyncHandler(async (req, res) => {
  const data = await AuthService.login(req.body);
  return sendSuccess(res, data);
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, AuthService.me(req.user));
});

export const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, AuthService.logout());
});

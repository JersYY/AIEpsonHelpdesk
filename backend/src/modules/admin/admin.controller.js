import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { AdminService } from "./admin.service.js";

export const getChatLogs = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getChatLogs(req.query));
});

export const getChatLogById = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getChatLogById(req.params.id));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getAnalytics());
});

export const getTopIssues = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getTopIssues());
});

export const getAccounts = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getAccounts(req.query));
});

export const updateAccountStatus = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.updateAccountStatus(req.params.id, req.body));
});

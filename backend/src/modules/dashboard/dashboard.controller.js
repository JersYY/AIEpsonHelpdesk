import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { DashboardService } from "./dashboard.service.js";

export const getUserDashboard = asyncHandler(async (req, res) => {
  return sendSuccess(res, await DashboardService.getUserDashboard(req.user));
});

export const getPopularIssues = asyncHandler(async (req, res) => {
  return sendSuccess(res, await DashboardService.getPopularIssues());
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  return sendSuccess(res, await DashboardService.getRecentActivity(req.user.id));
});

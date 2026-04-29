import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ReportsService } from "./reports.service.js";

export const generateSummary = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ReportsService.generateSummary(req.user, req.body));
});

export const sendEmail = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ReportsService.sendEmail(req.user, req.body));
});

export const listEmailLogs = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ReportsService.listEmailLogs(req.query));
});

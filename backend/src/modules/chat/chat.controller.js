import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ChatService } from "./chat.service.js";

export const sendMessage = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.sendMessage(req.user, req.body), 201);
});

export const getHistory = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.getHistory(req.user));
});

export const getSession = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.getSession(req.user, req.params.id));
});

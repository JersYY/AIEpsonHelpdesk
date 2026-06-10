import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ChatService } from "./chat.service.js";

export const sendMessage = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.sendMessage(req.user, req.body), 201);
});

export const getHistory = asyncHandler(async (req, res) => {
  const isArchived = req.query.archived === "true";
  return sendSuccess(res, await ChatService.getHistory(req.user, isArchived));
});

export const getSession = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.getSession(req.user, req.params.id));
});

export const renameSession = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.renameSession(req.user, req.params.id, req.body?.title));
});

export const archiveSession = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.archiveSession(req.user, req.params.id, true));
});

export const restoreSession = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.archiveSession(req.user, req.params.id, false));
});

export const deleteSession = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.deleteSession(req.user, req.params.id));
});

// POST /api/chat/messages/:id/feedback — user rates an AI answer (UP/DOWN).
export const submitFeedback = asyncHandler(async (req, res) => {
  return sendSuccess(
    res,
    await ChatService.submitFeedback(req.user, req.params.id, req.body?.rating, req.body?.comment),
  );
});

// PATCH /api/chat/messages/:id — edit a user message and regenerate the answer.
export const editMessage = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.editMessage(req.user, req.params.id, req.body?.message));
});

// POST /api/chat/messages/:id/regenerate — regenerate an AI answer.
export const regenerateMessage = asyncHandler(async (req, res) => {
  return sendSuccess(res, await ChatService.regenerateMessage(req.user, req.params.id));
});

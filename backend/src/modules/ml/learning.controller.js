import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { LearningService } from "./learning.service.js";

export const createFromSession = asyncHandler(async (req, res) => {
  return sendSuccess(
    res,
    await LearningService.candidateFromSession(req.params.sessionId, {
      createdByUserId: req.user.id,
    }),
    201,
  );
});

export const listCandidates = asyncHandler(async (req, res) => {
  return sendSuccess(res, await LearningService.listCandidates(req.query));
});

export const getCandidate = asyncHandler(async (req, res) => {
  return sendSuccess(res, await LearningService.getCandidate(req.params.id));
});

export const updateCandidate = asyncHandler(async (req, res) => {
  return sendSuccess(res, await LearningService.updateCandidate(req.params.id, req.body));
});

export const approveCandidate = asyncHandler(async (req, res) => {
  return sendSuccess(res, await LearningService.approveCandidate(req.params.id));
});

export const rejectCandidate = asyncHandler(async (req, res) => {
  return sendSuccess(res, await LearningService.rejectCandidate(req.params.id, req.body?.reason));
});

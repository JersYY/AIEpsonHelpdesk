import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { KnowledgeService } from "./knowledge.service.js";

export const listKnowledge = asyncHandler(async (req, res) => {
  return sendSuccess(res, await KnowledgeService.list(req.query));
});

export const createKnowledge = asyncHandler(async (req, res) => {
  return sendSuccess(res, await KnowledgeService.create(req.body), 201);
});

export const updateKnowledge = asyncHandler(async (req, res) => {
  return sendSuccess(res, await KnowledgeService.update(req.params.id, req.body));
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  return sendSuccess(res, await KnowledgeService.remove(req.params.id));
});

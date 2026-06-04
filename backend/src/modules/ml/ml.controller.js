import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/apiError.js";
import { MlService } from "./ml.service.js";
import { LearningService } from "./learning.service.js";

// POST /api/ml/train  (admin) — retrain all classifiers from seed + accumulated data
export const trainModels = asyncHandler(async (req, res) => {
  const result = await MlService.trainAll();
  return sendSuccess(res, result);
});

// GET /api/ml/status  (admin) — model versions, metrics, accumulated examples
export const getStatus = asyncHandler(async (req, res) => {
  return sendSuccess(res, await MlService.getStatus());
});

// POST /api/ml/predict  (admin/debug) — run all predictors on a text
export const predict = asyncHandler(async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) throw new ApiError(400, "text is required");

  const [intent, category, priority, escalation] = await Promise.all([
    MlService.predictIntent(text),
    MlService.predictCategory(text),
    MlService.predictPriority(text),
    MlService.predictEscalation(text),
  ]);

  return sendSuccess(res, { text, intent, category, priority, escalation });
});

// POST /api/ml/learn-ticket/:id  (admin) — convert a resolved ticket to knowledge
export const learnFromTicket = asyncHandler(async (req, res) => {
  const result = await LearningService.knowledgeFromResolvedTicket(req.params.id);
  return sendSuccess(res, result);
});

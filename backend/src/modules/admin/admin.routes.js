import express from "express";

import {
  getAiSettings,
  getAccounts,
  getAnalytics,
  getChatLogById,
  getChatLogs,
  getTopIssues,
  updateAiSettings,
  updateAccountStatus,
} from "./admin.controller.js";

const router = express.Router();

router.get("/ai-settings", getAiSettings);
router.patch("/ai-settings", updateAiSettings);
router.get("/chat-logs", getChatLogs);
router.get("/chat-logs/:id", getChatLogById);
router.get("/analytics", getAnalytics);
router.get("/top-issues", getTopIssues);
router.get("/accounts", getAccounts);
router.patch("/accounts/:id/status", updateAccountStatus);

export default router;

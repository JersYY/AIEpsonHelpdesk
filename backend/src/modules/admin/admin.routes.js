import express from "express";

import {
  getAccounts,
  getAnalytics,
  getChatLogById,
  getChatLogs,
  getTopIssues,
  updateAccountStatus,
} from "./admin.controller.js";

const router = express.Router();

router.get("/chat-logs", getChatLogs);
router.get("/chat-logs/:id", getChatLogById);
router.get("/analytics", getAnalytics);
router.get("/top-issues", getTopIssues);
router.get("/accounts", getAccounts);
router.patch("/accounts/:id/status", updateAccountStatus);

export default router;

import express from "express";

import { getAnalytics, getChatLogById, getChatLogs, getTopIssues } from "./admin.controller.js";

const router = express.Router();

router.get("/chat-logs", getChatLogs);
router.get("/chat-logs/:id", getChatLogById);
router.get("/analytics", getAnalytics);
router.get("/top-issues", getTopIssues);

export default router;

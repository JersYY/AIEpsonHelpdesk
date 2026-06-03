import express from "express";

import { getPopularIssues, getRecentActivity, getUserDashboard } from "./dashboard.controller.js";

const router = express.Router();

router.get("/", getUserDashboard);
router.get("/popular-issues", getPopularIssues);
router.get("/recent-activity", getRecentActivity);

export default router;

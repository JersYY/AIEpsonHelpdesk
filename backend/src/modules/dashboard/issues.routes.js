import express from "express";

import { getPopularIssues } from "./dashboard.controller.js";

const router = express.Router();

router.get("/popular", getPopularIssues);

export default router;

import express from "express";

import { getRecentActivity } from "./dashboard.controller.js";

const router = express.Router();

router.get("/recent", getRecentActivity);

export default router;

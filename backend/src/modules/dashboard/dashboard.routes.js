import express from "express";

import { getUserDashboard } from "./dashboard.controller.js";

const router = express.Router();

router.get("/user", getUserDashboard);

export default router;

import express from "express";

import { generateSummary, sendEmail } from "./reports.controller.js";

const router = express.Router();

router.post("/summary", generateSummary);
router.post("/send-email", sendEmail);

export default router;

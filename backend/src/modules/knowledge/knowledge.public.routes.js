import express from "express";

import { getKnowledge, getSuggestedQuestions, listKnowledge } from "./knowledge.controller.js";

// Read-only knowledge endpoints for USER/HELPDESK/ADMIN (FAQ page).
// CRUD remains under /api/admin/knowledge (ADMIN only).
const router = express.Router();

router.get("/", listKnowledge);
router.get("/suggested-questions", getSuggestedQuestions);
router.get("/:id", getKnowledge);

export default router;

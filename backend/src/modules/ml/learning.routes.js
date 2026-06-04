import express from "express";

import {
  approveCandidate,
  createFromSession,
  getCandidate,
  listCandidates,
  rejectCandidate,
  updateCandidate,
} from "./learning.controller.js";

// Self-learning candidate review (ADMIN/HELPDESK). Mounted under /api/learning.
const router = express.Router();

router.post("/candidates/from-session/:sessionId", createFromSession);
router.get("/candidates", listCandidates);
router.get("/candidates/:id", getCandidate);
router.patch("/candidates/:id", updateCandidate);
router.post("/candidates/:id/approve", approveCandidate);
router.post("/candidates/:id/reject", rejectCandidate);

export default router;

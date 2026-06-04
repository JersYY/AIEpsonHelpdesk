import express from "express";

import {
  archiveSession,
  deleteSession,
  editMessage,
  getHistory,
  getSession,
  regenerateMessage,
  renameSession,
  restoreSession,
  sendMessage,
  submitFeedback,
} from "./chat.controller.js";

const router = express.Router();

router.post("/message", sendMessage);
router.get("/history", getHistory);
router.get("/sessions/:id", getSession);
router.patch("/sessions/:id", renameSession);
router.delete("/sessions/:id", deleteSession);
router.post("/sessions/:id/archive", archiveSession);
router.post("/sessions/:id/restore", restoreSession);

router.patch("/messages/:id", editMessage);
router.post("/messages/:id/regenerate", regenerateMessage);
router.post("/messages/:id/feedback", submitFeedback);

export default router;

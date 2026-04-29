import express from "express";

import { getHistory, getSession, sendMessage } from "./chat.controller.js";

const router = express.Router();

router.post("/message", sendMessage);
router.get("/history", getHistory);
router.get("/sessions/:id", getSession);

export default router;

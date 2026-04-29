import express from "express";

import { createKnowledge, deleteKnowledge, listKnowledge, updateKnowledge } from "./knowledge.controller.js";

const router = express.Router();

router.get("/", listKnowledge);
router.post("/", createKnowledge);
router.put("/:id", updateKnowledge);
router.delete("/:id", deleteKnowledge);

export default router;

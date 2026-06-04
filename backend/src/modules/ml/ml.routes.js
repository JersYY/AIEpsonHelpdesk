import express from "express";

import { getStatus, learnFromTicket, predict, trainModels } from "./ml.controller.js";

const router = express.Router();

router.post("/train", trainModels);
router.get("/status", getStatus);
router.post("/predict", predict);
router.post("/learn-ticket/:id", learnFromTicket);

export default router;

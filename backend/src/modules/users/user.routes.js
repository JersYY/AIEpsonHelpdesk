import express from "express";

import { getPreferences, updatePreferences } from "./user.controller.js";

const router = express.Router();

router.get("/me/preferences", getPreferences);
router.patch("/me/preferences", updatePreferences);

export default router;

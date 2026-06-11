import express from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { changePassword, login, logout, me, register } from "./auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.patch("/password", requireAuth, changePassword);

export default router;

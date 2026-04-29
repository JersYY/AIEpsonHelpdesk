import express from "express";

import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { listEmailLogs } from "./reports.controller.js";

const router = express.Router();

router.get("/", authorizeRoles("ADMIN", "HELPDESK"), listEmailLogs);

export default router;

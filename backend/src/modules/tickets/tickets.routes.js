import express from "express";

import { authorizeRoles } from "../../middlewares/role.middleware.js";
import {
  addTicketComment,
  escalateTicket,
  getTicket,
  listTickets,
  myTicketById,
  myTickets,
  updateMyTicketResolution,
  updateTicketStatus,
} from "./tickets.controller.js";

const router = express.Router();

router.post("/escalate", authorizeRoles("USER", "ADMIN", "HELPDESK"), escalateTicket);
router.get("/my", authorizeRoles("USER"), myTickets);
router.post("/my/:id/comments", authorizeRoles("USER"), addTicketComment);
router.patch("/my/:id/resolution", authorizeRoles("USER"), updateMyTicketResolution);
router.get("/my/:id", authorizeRoles("USER"), myTicketById);
router.get("/", authorizeRoles("ADMIN", "HELPDESK"), listTickets);
router.post("/:id/comments", authorizeRoles("ADMIN", "HELPDESK"), addTicketComment);
router.get("/:id", authorizeRoles("ADMIN", "HELPDESK"), getTicket);
router.patch("/:id/status", authorizeRoles("ADMIN", "HELPDESK"), updateTicketStatus);

export default router;

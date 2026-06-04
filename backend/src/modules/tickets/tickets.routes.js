import express from "express";

import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { escalateTicket, getTicket, listTickets, myTicketById, myTickets, updateTicketStatus } from "./tickets.controller.js";

const router = express.Router();

router.post("/escalate", authorizeRoles("USER", "ADMIN", "HELPDESK"), escalateTicket);
router.get("/my", authorizeRoles("USER"), myTickets);
router.get("/my/:id", authorizeRoles("USER"), myTicketById);
router.get("/", authorizeRoles("ADMIN", "HELPDESK"), listTickets);
router.get("/:id", authorizeRoles("ADMIN", "HELPDESK"), getTicket);
router.patch("/:id/status", authorizeRoles("ADMIN", "HELPDESK"), updateTicketStatus);

export default router;

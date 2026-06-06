import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { TicketsService } from "./tickets.service.js";

export const escalateTicket = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.escalate(req.user, req.body), 201);
});

export const myTickets = asyncHandler(async (req, res) => {
  return sendSuccess(
    res,
    await TicketsService.myTickets(req.user)
  );
});

export const myTicketById = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.myTicketById(req.user, req.params.id));
});

export const listTickets = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.list(req.query));
});

export const getTicket = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.getById(req.params.id));
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.updateStatus(req.params.id, req.body));
});

export const addTicketComment = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.addComment(req.user, req.params.id, req.body), 201);
});

export const updateMyTicketResolution = asyncHandler(async (req, res) => {
  return sendSuccess(res, await TicketsService.updateMyResolution(req.user, req.params.id, req.body));
});

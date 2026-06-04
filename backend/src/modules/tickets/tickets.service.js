import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { buildConversationSummary } from "../../utils/summary.js";
import { assertEnum, requireFields, toInt } from "../../utils/validators.js";

const ticketInclude = {
  user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
  session: { select: { id: true, title: true, status: true } },
  category: true,
  emailLogs: { orderBy: { sentAt: "desc" } },
};

const formatTicketCode = (ticketNumber) => {
  if (!ticketNumber) return null;

  return `TKT-${String(ticketNumber).padStart(4, "0")}`;
};

const withTicketCode = (ticket) => {
  if (!ticket) return ticket;

  return {
    ...ticket,
    ticketCode: formatTicketCode(ticket.ticketNumber),
  };
};

export const TicketsService = {
  async myTickets(user) {
    const tickets = await prisma.escalationTicket.findMany({
      where: {
        userId: user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: ticketInclude,
    });

    return tickets.map(withTicketCode);
  },

  async escalate(user, payload) {
    requireFields(payload, ["sessionId"]);
    assertEnum(payload.priority, ["LOW", "MEDIUM", "HIGH"], "priority");

    const session = await prisma.chatSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { image: true },
        },
      },
    });

    if (!session) throw new ApiError(404, "Chat session not found");
    if (user.role === "USER" && session.userId !== user.id) {
      throw new ApiError(403, "You can only escalate your own chat session");
    }

    const categoryId = payload.categoryId || session.categoryId || null;
    if (categoryId) {
      const category = await prisma.issueCategory.findUnique({ where: { id: categoryId } });
      if (!category) throw new ApiError(404, "Issue category not found");
    }

    const summary = buildConversationSummary(session.messages);

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.escalationTicket.create({
        data: {
          sessionId: session.id,
          userId: session.userId,
          categoryId,
          summary,
          priority: payload.priority || "MEDIUM",
          status: "OPEN",
        },
        include: ticketInclude,
      });

      await tx.chatSession.update({
        where: { id: session.id },
        data: {
          status: "ESCALATED",
          categoryId,
        },
      });

      return created;
    });

    return withTicketCode(ticket);
  },

  async list(query = {}) {
    const page = Math.max(toInt(query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
    const skip = (page - 1) * limit;
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.escalationTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: ticketInclude,
      }),
      prisma.escalationTicket.count({ where }),
    ]);

    return {
      items: items.map(withTicketCode),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id) {
    const ticket = await prisma.escalationTicket.findUnique({
      where: { id },
      include: ticketInclude,
    });

    if (!ticket) throw new ApiError(404, "Ticket not found");
    return withTicketCode(ticket);
  },

  async updateStatus(id, payload) {
    requireFields(payload, ["status"]);
    assertEnum(payload.status, ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], "status");

    const ticket = await prisma.escalationTicket.findUnique({ where: { id } });
    if (!ticket) throw new ApiError(404, "Ticket not found");

    const updated = await prisma.escalationTicket.update({
      where: { id },
      data: { status: payload.status },
      include: ticketInclude,
    });

    if (payload.status === "RESOLVED" || payload.status === "CLOSED") {
      await prisma.chatSession.update({
        where: { id: updated.sessionId },
        data: { status: "RESOLVED" },
      });
    }

    return withTicketCode(updated);
  },
};

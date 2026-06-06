import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { buildConversationSummary } from "../../utils/summary.js";
import { assertEnum, requireFields, toInt } from "../../utils/validators.js";
import { LearningService } from "../ml/learning.service.js";
import { MlService } from "../ml/ml.service.js";

const ticketInclude = {
  user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
  session: { select: { id: true, title: true, status: true } },
  category: true,
  emailLogs: { orderBy: { sentAt: "desc" } },
  comments: {
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, employeeId: true, name: true, role: true, department: true } },
    },
  },
};

const formatTicketCode = (ticketNumber) => {
  if (!ticketNumber) return null;

  return `TKT-${String(ticketNumber).padStart(3, "0")}`;
};

const withTicketCode = (ticket) => {
  if (!ticket) return ticket;

  return {
    ...ticket,
    ticketCode: formatTicketCode(ticket.ticketNumber),
  };
};

const commentInclude = {
  author: { select: { id: true, employeeId: true, name: true, role: true, department: true } },
};

const assertTicketAccess = (ticket, user) => {
  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (user.role === "USER" && ticket.userId !== user.id) {
    throw new ApiError(404, "Ticket not found");
  }
};

const cleanMessage = (payload) => {
  const message = `${payload?.message || ""}`.trim();
  if (!message) throw new ApiError(400, "Message is required");
  if (message.length > 4000) throw new ApiError(400, "Message is too long");
  return message;
};

const syncResolvedSession = async (tx, ticket) => {
  await tx.chatSession.update({
    where: { id: ticket.sessionId },
    data: { status: "RESOLVED" },
  });
};

const proposeLearningCandidate = async (sessionId) => {
  try {
    await LearningService.candidateFromSession(sessionId, { confidenceScore: 0.8 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[ml] candidate from resolved ticket skipped: ${error.message}`);
    }
  }
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

  async myTicketById(user, id) {
    const ticket = await prisma.escalationTicket.findUnique({
      where: { id },
      include: ticketInclude,
    });

    if (!ticket || ticket.userId !== user.id) {
      throw new ApiError(404, "Ticket not found");
    }

    return withTicketCode(ticket);
  },

  async escalate(user, payload) {
    requireFields(payload, ["sessionId"]);
    assertEnum(payload.priority, ["LOW", "MEDIUM", "HIGH"], "priority");

    const session = await prisma.chatSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
        category: true,
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
    let category = session.category || null;
    if (categoryId) {
      category = await prisma.issueCategory.findUnique({ where: { id: categoryId } });
      if (!category) throw new ApiError(404, "Issue category not found");
    }

    // ML: suggest a priority from the conversation; use it as default when the
    // caller did not specify one.
    let suggestedPriority = null;
    try {
      const prediction = await MlService.predictPriority(
        buildConversationSummary(session.messages, {
          requester: session.user,
          category,
          priority: payload.priority || "MEDIUM",
        }),
      );
      suggestedPriority = prediction.label;
    } catch {
      suggestedPriority = null;
    }

    const resolvedPriority = payload.priority || suggestedPriority || "MEDIUM";
    const summary = buildConversationSummary(session.messages, {
      requester: session.user,
      category,
      priority: resolvedPriority,
      status: "OPEN",
    });

    const ticket = await prisma.$transaction(async (tx) => {

      const created = await tx.escalationTicket.create({
        data: {
          sessionId: session.id,
          userId: session.userId,
          categoryId,
          summary,
          priority: resolvedPriority,
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

    return { ...withTicketCode(ticket), suggestedPriority };
  },

  async list(query = {}) {
    const page = Math.max(toInt(query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
    const skip = (page - 1) * limit;
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? {
            OR: [
              { summary: { contains: query.q, mode: "insensitive" } },
              { user: { name: { contains: query.q, mode: "insensitive" } } },
              { user: { employeeId: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
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
      include: {
        ...ticketInclude,
        session: {
          include: {
            user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
            category: true,
            messages: {
              orderBy: { createdAt: "asc" },
              include: { image: true },
            },
          },
        },
      },
    });

    if (!ticket) throw new ApiError(404, "Ticket not found");
    return withTicketCode({
      ...ticket,
      summary: buildConversationSummary(ticket.session.messages, {
        requester: ticket.session.user || ticket.user,
        category: ticket.category || ticket.session.category,
        priority: ticket.priority,
        status: ticket.status,
      }),
    });
  },

  async updateStatus(id, payload) {
    requireFields(payload, ["status"]);
    assertEnum(payload.status, ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], "status");

    const ticket = await prisma.escalationTicket.findUnique({ where: { id } });
    if (!ticket) throw new ApiError(404, "Ticket not found");

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.escalationTicket.update({
        where: { id },
        data: { status: payload.status },
        include: ticketInclude,
      });

      if (payload.status === "RESOLVED" || payload.status === "CLOSED") {
        await syncResolvedSession(tx, result);
      }

      return result;
    });

    if (payload.status === "RESOLVED" || payload.status === "CLOSED") {
      // Continuous learning (SAFE): resolved case proposes a knowledge CANDIDATE
      // for admin/helpdesk review. It does NOT auto-modify the knowledge base.
      await proposeLearningCandidate(updated.sessionId);
    }

    return withTicketCode(updated);
  },

  async addComment(user, id, payload) {
    const message = cleanMessage(payload);
    const ticket = await prisma.escalationTicket.findUnique({ where: { id } });
    assertTicketAccess(ticket, user);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.ticketComment.create({
        data: {
          ticketId: id,
          authorId: user.id,
          message,
        },
        include: commentInclude,
      });

      if ((user.role === "ADMIN" || user.role === "HELPDESK") && ticket.status === "OPEN") {
        await tx.escalationTicket.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
      }

      return tx.escalationTicket.findUnique({
        where: { id },
        include: ticketInclude,
      });
    });

    return withTicketCode(updated);
  },

  async updateMyResolution(user, id, payload) {
    const resolved = payload?.resolved;
    if (typeof resolved !== "boolean") {
      throw new ApiError(400, "resolved must be true or false");
    }

    const ticket = await prisma.escalationTicket.findUnique({ where: { id } });
    assertTicketAccess(ticket, user);

    const fallbackMessage = resolved
      ? "Operator mengonfirmasi solusi berhasil dan ticket dapat ditutup."
      : "Operator mengonfirmasi kendala masih terjadi dan perlu tindak lanjut helpdesk.";
    const rawMessage = `${payload?.message || ""}`.trim();
    if (rawMessage.length > 4000) throw new ApiError(400, "Message is too long");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.ticketComment.create({
        data: {
          ticketId: id,
          authorId: user.id,
          message: rawMessage || fallbackMessage,
        },
      });

      const result = await tx.escalationTicket.update({
        where: { id },
        data: { status: resolved ? "CLOSED" : "IN_PROGRESS" },
        include: ticketInclude,
      });

      if (resolved) {
        await syncResolvedSession(tx, result);
      }

      return result;
    });

    if (resolved) {
      await proposeLearningCandidate(updated.sessionId);
    }

    return withTicketCode(updated);
  },
};

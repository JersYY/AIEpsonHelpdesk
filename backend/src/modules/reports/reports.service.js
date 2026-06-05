import nodemailer from "nodemailer";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { buildConversationSummary } from "../../utils/summary.js";
import { requireFields, toInt } from "../../utils/validators.js";

const getTransport = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST || "localhost",
    port: env.SMTP_PORT || 1025,
    secure: false,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
};

const assertEmail = (email) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Invalid recipientEmail");
  }
};

const sessionWithMessageImages = {
  user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
  category: true,
  messages: {
    orderBy: { createdAt: "asc" },
    include: { image: true },
  },
};

const fileAttachmentsFromMessages = (messages = []) => messages
  .filter((message) => message.image)
  .map((message) => ({
    filename: message.image.originalName || message.image.storedName,
    path: message.image.storagePath,
    contentType: message.image.mimeType,
  }));

const getReportSource = async (user, payload) => {
  if (!payload.sessionId && !payload.ticketId) {
    throw new ApiError(400, "sessionId or ticketId is required");
  }

  if (payload.ticketId) {
    const ticket = await prisma.escalationTicket.findUnique({
      where: { id: payload.ticketId },
      include: {
        category: true,
        session: {
          include: sessionWithMessageImages,
        },
      },
    });

    if (!ticket) throw new ApiError(404, "Ticket not found");
    if (user.role === "USER" && ticket.userId !== user.id) {
      throw new ApiError(403, "You can only summarize your own ticket");
    }

    return {
      summary: buildConversationSummary(ticket.session.messages, {
        requester: ticket.session.user,
        category: ticket.category || ticket.session.category,
        priority: ticket.priority,
        status: ticket.status,
      }),
      source: { ticketId: ticket.id, sessionId: ticket.sessionId },
      messages: ticket.session.messages,
    };
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: payload.sessionId },
    include: sessionWithMessageImages,
  });

  if (!session) throw new ApiError(404, "Chat session not found");
  if (user.role === "USER" && session.userId !== user.id) {
    throw new ApiError(403, "You can only summarize your own chat session");
  }

  return {
    summary: buildConversationSummary(session.messages, {
      requester: session.user,
      category: session.category,
    }),
    source: { sessionId: session.id },
    messages: session.messages,
  };
};

export const ReportsService = {
  async generateSummary(user, payload) {
    const reportSource = await getReportSource(user, payload);
    return {
      summary: reportSource.summary,
      source: reportSource.source,
      attachments: fileAttachmentsFromMessages(reportSource.messages).map((attachment) => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
      })),
    };
  },

  async sendEmail(user, payload) {
    requireFields(payload, ["recipientEmail"]);
    assertEmail(payload.recipientEmail);

    const summaryResult = await getReportSource(user, payload);
    const subject = payload.subject || "Epson AI Helpdesk Summary Report";
    const emailSummary = String(payload.summary || "").trim() || summaryResult.summary;
    const attachments = fileAttachmentsFromMessages(summaryResult.messages);

    try {
      await getTransport().sendMail({
        from: env.SMTP_FROM,
        to: payload.recipientEmail,
        subject,
        text: emailSummary,
        attachments,
      });

      const emailLog = await prisma.emailLog.create({
        data: {
          ticketId: summaryResult.source.ticketId || null,
          recipientEmail: payload.recipientEmail,
          subject,
          status: "SENT",
        },
      });

      return {
        sent: true,
        emailLog,
        summary: emailSummary,
        source: summaryResult.source,
        mailpitUrl: env.MAILPIT_WEB_URL || null,
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
        })),
      };
    } catch (error) {
      const emailLog = await prisma.emailLog.create({
        data: {
          ticketId: summaryResult.source.ticketId || null,
          recipientEmail: payload.recipientEmail,
          subject,
          status: "FAILED",
        },
      });

      return {
        sent: false,
        emailLog,
        summary: emailSummary,
        source: summaryResult.source,
        mailpitUrl: env.MAILPIT_WEB_URL || null,
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
        })),
        error: error.message,
      };
    }
  },

  async listEmailLogs(query = {}) {
    const page = Math.max(toInt(query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
    const skip = (page - 1) * limit;
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.ticketId ? { ticketId: query.ticketId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
        include: { ticket: true },
      }),
      prisma.emailLog.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};

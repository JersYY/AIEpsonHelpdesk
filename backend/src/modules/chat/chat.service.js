import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { buildConversationSummary, titleFromMessage } from "../../utils/summary.js";
import { RagService } from "./rag.service.js";

const confidenceScore = () => Number((0.7 + Math.random() * 0.2).toFixed(2));

const ensureUserSession = async (sessionId, user) => {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new ApiError(404, "Chat session not found");
  }

  if (user.role === "USER" && session.userId !== user.id) {
    throw new ApiError(403, "You can only access your own chat session");
  }

  return session;
};

export const ChatService = {
  async sendMessage(user, payload) {
    const { sessionId, categoryId, imageId, title } = payload;
    const message = payload.message?.trim();

    if (!message && !imageId) {
      throw new ApiError(400, "Message or imageId is required");
    }

    let image = null;
    if (imageId) {
      image = await prisma.uploadedFile.findUnique({ where: { id: imageId } });
      if (!image) throw new ApiError(404, "Uploaded image not found");
      if (user.role === "USER" && image.userId !== user.id) {
        throw new ApiError(403, "You can only use your own uploaded image");
      }
    }

    let session;
    if (sessionId) {
      session = await ensureUserSession(sessionId, user);
      if (categoryId && !session.categoryId) {
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: { categoryId },
        });
      }
    } else {
      session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          categoryId: categoryId || null,
          title: title || titleFromMessage(message),
        },
      });
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "USER",
        messageText: message || "[Image uploaded]",
        imageId: image?.id || null,
      },
    });

    const startedAt = Date.now();
    const contexts = await RagService.searchRelevantChunks(message || "");
    const answer = await RagService.generateAnswer({
      message,
      contexts,
      imagePath: image?.storagePath || null,
    });
    const responseTimeMs = Date.now() - startedAt;

    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "AI",
        messageText: answer.text,
        confidenceScore: confidenceScore(),
        responseTimeMs,
      },
    });

    const updatedSession = await prisma.chatSession.findUnique({
      where: { id: session.id },
      include: { category: true },
    });

    return {
      session: updatedSession,
      userMessage,
      aiMessage,
      contexts,
      provider: answer.provider,
    };
  },

  async getHistory(user) {
    const where = user.role === "USER" ? { userId: user.id } : {};

    return prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        _count: { select: { messages: true, escalationTickets: true } },
      },
    });
  },

  async getSession(user, id) {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, employeeId: true, name: true, email: true, role: true, department: true },
        },
        category: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: { image: true },
        },
        escalationTickets: true,
      },
    });

    if (!session) throw new ApiError(404, "Chat session not found");
    if (user.role === "USER" && session.userId !== user.id) {
      throw new ApiError(403, "You can only access your own chat session");
    }

    return session;
  },

  async summarizeSession(user, sessionId) {
    const session = await this.getSession(user, sessionId);
    return buildConversationSummary(session.messages);
  },
};

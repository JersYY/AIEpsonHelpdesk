import { aiConfig } from "../../config/ai.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { buildConversationSummary, titleFromMessage } from "../../utils/summary.js";
import { RagService } from "./rag.service.js";

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const waitForMinimumResponseTime = async (startedAt) => {
  const remainingMs = aiConfig.response.minDelayMs - (Date.now() - startedAt);
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
};

const confidenceScore = ({ provider, contexts }) => {
  const topScore = contexts
    .map((context) => Number(context.score))
    .find((score) => Number.isFinite(score));

  if (Number.isFinite(topScore)) {
    const providerBoost = provider === "gemini" ? 0.1 : 0;
    return Number(Math.min(0.95, Math.max(0.4, topScore + providerBoost)).toFixed(2));
  }

  if (contexts.length) {
    return provider === "gemini" ? 0.74 : 0.62;
  }

  return provider === "gemini" ? 0.55 : 0.45;
};

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
        messageText: message || "[Gambar diunggah]",
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
    await waitForMinimumResponseTime(startedAt);
    const responseTimeMs = Date.now() - startedAt;

    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "AI",
        messageText: answer.text,
        confidenceScore: confidenceScore({ provider: answer.provider, contexts }),
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

import { aiConfig } from "../../config/ai.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { buildConversationSummary, titleFromMessage } from "../../utils/summary.js";
import { MlService } from "../ml/ml.service.js";
import { LearningService } from "../ml/learning.service.js";
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

const isKnowledgeGrounded = (contexts = []) => contexts.length > 0;

// Visible (non-deleted) session filter helper.
const visibleScope = (user, extra = {}) => ({
  deletedAt: null,
  ...(user.role === "USER" ? { userId: user.id } : {}),
  ...extra,
});

const ensureUserSession = async (sessionId, user) => {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.deletedAt) {
    throw new ApiError(404, "Chat session not found");
  }

  if (user.role === "USER" && session.userId !== user.id) {
    throw new ApiError(403, "You can only access your own chat session");
  }

  return session;
};

// Shared AI pipeline: run ML predictions + RAG + generation for a user message.
const runAiPipeline = async ({ message, imagePath = null }) => {
  let categoryPrediction = null;
  let intentPrediction = null;

  if (message) {
    try {
      categoryPrediction = await MlService.predictCategory(message);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[ml] category prediction skipped: ${error.message}`);
      }
    }

    try {
      const intentResult = await MlService.predictIntent(message);
      if (intentResult.confidence >= 0.5) {
        intentPrediction = intentResult.label;
      }
    } catch {
      intentPrediction = null;
    }
  }

  const startedAt = Date.now();
  const contexts = await RagService.searchRelevantChunks(message || "");
  const answer = await RagService.generateAnswer({
    message,
    contexts,
    imagePath,
    intent: intentPrediction,
  });
  await waitForMinimumResponseTime(startedAt);
  const responseTimeMs = Date.now() - startedAt;

  const score = confidenceScore({ provider: answer.provider, contexts });

  let escalation = null;
  if (message) {
    try {
      escalation = await MlService.predictEscalation(message, { aiConfidence: score });
    } catch {
      escalation = null;
    }
  }

  return { categoryPrediction, contexts, answer, responseTimeMs, score, escalation };
};

const buildPrediction = (categoryPrediction, escalation) => ({
  category: categoryPrediction
    ? {
        name: categoryPrediction.label,
        categoryId: categoryPrediction.categoryId,
        confidence: categoryPrediction.confidence,
      }
    : null,
  escalation,
});

export const ChatService = {
  async sendMessage(user, payload) {
    const { sessionId, categoryId, imageId, title } = payload;
    const message = payload.message?.trim();
    const temporary = payload.temporary === true;

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

    // TEMPORARY MODE: never persist session/messages, never feed self-learning.
    if (temporary && !sessionId) {
      const { categoryPrediction, contexts, answer, escalation } = await runAiPipeline({
        message,
        imagePath: image?.storagePath || null,
      });

      return {
        session: null,
        userMessage: null,
        aiMessage: {
          sender: "AI",
          messageText: answer.text,
          confidenceScore: confidenceScore({ provider: answer.provider, contexts }),
          knowledgeGrounded: isKnowledgeGrounded(contexts),
        },
        contexts,
        provider: answer.provider,
        temporary: true,
        prediction: buildPrediction(categoryPrediction, escalation),
      };
    }

    let session;
    if (sessionId) {
      session = await ensureUserSession(sessionId, user);
      if (session.isTemporary) {
        throw new ApiError(400, "Cannot continue a temporary session");
      }
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

    const { categoryPrediction, contexts, answer, responseTimeMs, score, escalation } =
      await runAiPipeline({ message, imagePath: image?.storagePath || null });

    // Auto-assign category to the session when confident and not already set.
    if (
      categoryPrediction?.categoryId
      && categoryPrediction.confidence >= 0.4
      && !session.categoryId
    ) {
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: { categoryId: categoryPrediction.categoryId },
      });
    }

    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "AI",
        messageText: answer.text,
        confidenceScore: score,
        responseTimeMs,
        predictedCategoryId: categoryPrediction?.categoryId || null,
        predictedConfidence: categoryPrediction?.confidence || null,
      },
    });

    const updatedSession = await prisma.chatSession.findUnique({
      where: { id: session.id },
      include: { category: true },
    });

    return {
      session: updatedSession,
      userMessage,
      aiMessage: { ...aiMessage, knowledgeGrounded: isKnowledgeGrounded(contexts) },
      contexts,
      provider: answer.provider,
      temporary: false,
      prediction: buildPrediction(categoryPrediction, escalation),
    };
  },

  async getHistory(user) {
    // Exclude temporary, archived, and soft-deleted sessions from history.
    return prisma.chatSession.findMany({
      where: visibleScope(user, { isTemporary: false, archived: false }),
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

    if (!session || session.deletedAt) throw new ApiError(404, "Chat session not found");
    if (user.role === "USER" && session.userId !== user.id) {
      throw new ApiError(403, "You can only access your own chat session");
    }

    return session;
  },

  async renameSession(user, id, title) {
    const clean = String(title || "").trim();
    if (!clean) throw new ApiError(400, "title is required");

    await ensureUserSession(id, user);
    const updated = await prisma.chatSession.update({
      where: { id },
      data: { title: clean.slice(0, 200) },
      include: { category: true },
    });
    return updated;
  },

  async archiveSession(user, id, archived = true) {
    await ensureUserSession(id, user);
    return prisma.chatSession.update({
      where: { id },
      data: { archived },
      include: { category: true },
    });
  },

  async deleteSession(user, id) {
    await ensureUserSession(id, user);
    // Soft delete to preserve data for audit (PRD section 6.7.2).
    await prisma.chatSession.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  },

  async submitFeedback(user, messageId, rating, comment = null) {
    if (!["UP", "DOWN"].includes(rating)) {
      throw new ApiError(400, "rating must be UP or DOWN");
    }

    const aiMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { session: true },
    });

    if (!aiMessage) throw new ApiError(404, "Message not found");
    if (aiMessage.sender !== "AI") {
      throw new ApiError(400, "Feedback can only be given on AI messages");
    }
    if (user.role === "USER" && aiMessage.session.userId !== user.id) {
      throw new ApiError(403, "You can only rate messages in your own session");
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { feedback: rating, feedbackComment: comment || null },
    });

    // Continuous learning: positive feedback becomes labeled training data
    // (classifier signal only - NOT the knowledge base, which requires review).
    if (!aiMessage.session.isTemporary) {
      try {
        await LearningService.learnFromFeedback(messageId, rating);
        // Positive feedback also proposes a knowledge candidate for review.
        if (rating === "UP") {
          await LearningService.candidateFromSession(aiMessage.sessionId, {
            createdByUserId: user.id,
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[ml] feedback learning skipped: ${error.message}`);
        }
      }
    }

    return { id: updated.id, feedback: updated.feedback };
  },

  async editMessage(user, messageId, newText) {
    const clean = String(newText || "").trim();
    if (!clean) throw new ApiError(400, "message is required");

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { session: true },
    });

    if (!message) throw new ApiError(404, "Message not found");
    if (message.sender !== "USER") {
      throw new ApiError(400, "Only user messages can be edited");
    }
    if (user.role === "USER" && message.session.userId !== user.id) {
      throw new ApiError(403, "You can only edit messages in your own session");
    }

    // Update the user message and drop the AI answers that followed it, then
    // regenerate a fresh answer from the edited prompt.
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { messageText: clean, editedAt: new Date() },
    });

    await prisma.chatMessage.deleteMany({
      where: {
        sessionId: message.sessionId,
        createdAt: { gt: message.createdAt },
      },
    });

    return this.regenerateFromUserMessage(user, message.sessionId, clean);
  },

  async regenerateMessage(user, aiMessageId) {
    const aiMessage = await prisma.chatMessage.findUnique({
      where: { id: aiMessageId },
      include: { session: true },
    });

    if (!aiMessage) throw new ApiError(404, "Message not found");
    if (aiMessage.sender !== "AI") {
      throw new ApiError(400, "Only AI messages can be regenerated");
    }
    if (user.role === "USER" && aiMessage.session.userId !== user.id) {
      throw new ApiError(403, "You can only regenerate messages in your own session");
    }

    const prevUser = await prisma.chatMessage.findFirst({
      where: {
        sessionId: aiMessage.sessionId,
        sender: "USER",
        createdAt: { lt: aiMessage.createdAt },
      },
      orderBy: { createdAt: "desc" },
      include: { image: true },
    });

    if (!prevUser) throw new ApiError(400, "No source user message to regenerate from");

    // Remove the old AI answer (and anything after it) before regenerating.
    await prisma.chatMessage.deleteMany({
      where: {
        sessionId: aiMessage.sessionId,
        createdAt: { gte: aiMessage.createdAt },
      },
    });

    return this.regenerateFromUserMessage(
      user,
      aiMessage.sessionId,
      prevUser.messageText,
      prevUser.image?.storagePath || null,
    );
  },

  // Internal: produce and persist a new AI answer for the given session.
  async regenerateFromUserMessage(user, sessionId, message, imagePath = null) {
    const { categoryPrediction, contexts, answer, responseTimeMs, score, escalation } =
      await runAiPipeline({ message, imagePath });

    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: "AI",
        messageText: answer.text,
        confidenceScore: score,
        responseTimeMs,
        predictedCategoryId: categoryPrediction?.categoryId || null,
        predictedConfidence: categoryPrediction?.confidence || null,
      },
    });

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { category: true },
    });

    return {
      session,
      aiMessage: { ...aiMessage, knowledgeGrounded: isKnowledgeGrounded(contexts) },
      contexts,
      provider: answer.provider,
      prediction: buildPrediction(categoryPrediction, escalation),
    };
  },

  async summarizeSession(user, sessionId) {
    const session = await this.getSession(user, sessionId);
    return buildConversationSummary(session.messages);
  },
};

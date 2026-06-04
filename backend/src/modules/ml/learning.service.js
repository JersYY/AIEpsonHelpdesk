// "Learning from conversations" — the SAFE version per PRD section 8.8.
// Validated, non-temporary conversations produce KnowledgeCandidates that MUST
// be reviewed/approved by admin/helpdesk before becoming KnowledgeDocuments.
// Classifier training data (intent/category/priority) may still accumulate
// automatically since that only nudges scoring, never RAG answers.

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const chunkContent = (content, maxLength = 900) => {
  const paragraphs = String(content)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = "";
  for (const paragraph of paragraphs.length ? paragraphs : [content]) {
    if (`${buffer}\n\n${paragraph}`.trim().length > maxLength && buffer) {
      chunks.push(buffer.trim());
      buffer = paragraph;
    } else {
      buffer = `${buffer}\n\n${paragraph}`.trim();
    }
  }
  if (buffer) chunks.push(buffer.trim());
  return chunks;
};

// Best-effort redaction of obvious sensitive tokens before review.
const redact = (text = "") =>
  String(text)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b(?:\+?62|0)8[0-9]{7,12}\b/g, "[phone]")
    .replace(/\b\d{16}\b/g, "[card]")
    .replace(/(password|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi, "$1: [redacted]");

export const LearningService = {
  async addTrainingExample({ text, label, task, source = "conversation" }) {
    const cleanText = String(text || "").trim();
    if (!cleanText || !label || !task) return null;

    const existing = await prisma.trainingExample.findFirst({
      where: { text: cleanText, task, label },
    });
    if (existing) return existing;

    return prisma.trainingExample.create({
      data: { text: cleanText.slice(0, 4000), label, task, source },
    });
  },

  // Capture classifier training signal from positive feedback (safe; not RAG).
  async learnFromFeedback(messageId, rating) {
    if (rating !== "UP") return;

    const aiMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { session: { include: { category: true } } },
    });
    if (!aiMessage || aiMessage.sender !== "AI" || aiMessage.session?.isTemporary) return;

    const prevUser = await prisma.chatMessage.findFirst({
      where: {
        sessionId: aiMessage.sessionId,
        sender: "USER",
        createdAt: { lt: aiMessage.createdAt },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!prevUser?.messageText) return;

    await this.addTrainingExample({
      text: prevUser.messageText,
      label: "helpdesk",
      task: "intent",
      source: "feedback",
    });

    const categoryName = aiMessage.session?.category?.name;
    if (categoryName) {
      await this.addTrainingExample({
        text: prevUser.messageText,
        label: categoryName,
        task: "category",
        source: "feedback",
      });
    }
  },

  // Create a PENDING knowledge candidate from a validated session.
  // Never runs for temporary sessions. Deduplicated per source session.
  async candidateFromSession(sessionId, { createdByUserId = null, confidenceScore = null } = {}) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        category: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session || session.isTemporary || session.deletedAt) {
      return { created: false, reason: "Session not eligible" };
    }

    const existing = await prisma.knowledgeCandidate.findFirst({
      where: { sourceSessionId: sessionId, status: { in: ["PENDING", "NEEDS_EDIT"] } },
    });
    if (existing) return { created: false, reason: "Candidate already pending", id: existing.id };

    const firstUser = session.messages.find((m) => m.sender === "USER");
    const conversation = session.messages
      .map((m) => `${m.sender}: ${m.messageText}`)
      .join("\n");

    const title = `${(firstUser?.messageText || session.title || "Helpdesk case").slice(0, 80)}`;
    const content = redact(
      [
        `Masalah: ${firstUser?.messageText || session.title}`,
        "",
        "Percakapan tervalidasi:",
        conversation,
      ].join("\n"),
    );

    const candidate = await prisma.knowledgeCandidate.create({
      data: {
        sourceSessionId: sessionId,
        createdByUserId,
        title,
        content,
        categoryId: session.categoryId || null,
        status: "PENDING",
        confidenceScore,
        redactionStatus: "REDACTED",
      },
    });

    return { created: true, id: candidate.id };
  },

  async listCandidates(query = {}) {
    const where = query.status ? { status: query.status } : {};
    return prisma.knowledgeCandidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  },

  async getCandidate(id) {
    const candidate = await prisma.knowledgeCandidate.findUnique({ where: { id } });
    if (!candidate) throw new ApiError(404, "Candidate not found");
    return candidate;
  },

  async updateCandidate(id, payload = {}) {
    await this.getCandidate(id);
    return prisma.knowledgeCandidate.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: String(payload.title).trim() } : {}),
        ...(payload.content !== undefined ? { content: String(payload.content) } : {}),
        ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId || null } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    });
  },

  // Approve a candidate -> create a real KnowledgeDocument (+ chunks) for RAG.
  async approveCandidate(id) {
    const candidate = await this.getCandidate(id);
    if (candidate.status === "APPROVED") {
      throw new ApiError(400, "Candidate already approved");
    }

    const document = await prisma.knowledgeDocument.create({
      data: {
        title: candidate.title,
        source: `Approved candidate ${candidate.id.slice(0, 8)}`,
        content: candidate.content,
        categoryId: candidate.categoryId || null,
      },
    });

    await prisma.knowledgeChunk.createMany({
      data: chunkContent(candidate.content).map((chunkText, index) => ({
        documentId: document.id,
        chunkText,
        metadata: { chunkIndex: index, source: "approved-candidate", candidateId: id },
      })),
    });

    const updated = await prisma.knowledgeCandidate.update({
      where: { id },
      data: { status: "APPROVED", approvedDocumentId: document.id },
    });

    return { candidate: updated, documentId: document.id };
  },

  async rejectCandidate(id, reason = null) {
    await this.getCandidate(id);
    return prisma.knowledgeCandidate.update({
      where: { id },
      data: { status: "REJECTED", reviewNote: reason || null },
    });
  },
};

export default LearningService;

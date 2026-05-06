import { aiConfig } from "../../config/ai.js";
import { prisma } from "../../config/prisma.js";
import { GeminiProvider } from "./providers/gemini.provider.js";

const EMBEDDING_TASK_TYPES = new Set([
  "RETRIEVAL_QUERY",
  "RETRIEVAL_DOCUMENT",
  "SEMANTIC_SIMILARITY",
  "CLASSIFICATION",
  "CLUSTERING",
]);

const normalizeTaskType = (taskType) => (
  EMBEDDING_TASK_TYPES.has(taskType) ? taskType : "RETRIEVAL_QUERY"
);

const normalizeEmbedding = (embedding) => {
  if (!Array.isArray(embedding) || !embedding.length) {
    return null;
  }

  const values = embedding.map((value) => Number(value));
  const invalidIndex = values.findIndex((value) => !Number.isFinite(value));

  if (invalidIndex !== -1) {
    throw new Error(`Embedding contains invalid number at index ${invalidIndex}`);
  }

  if (values.length !== aiConfig.gemini.embeddingDim) {
    throw new Error(
      `Embedding dimension mismatch: expected ${aiConfig.gemini.embeddingDim}, received ${values.length}`,
    );
  }

  return values;
};

const warnEmbeddingSkipped = (message) => {
  if (process.env.NODE_ENV !== "test") {
    console.warn(`[ai] embedding skipped: ${message}`);
  }
};

export const EmbeddingService = {
  isConfigured() {
    return Boolean(aiConfig.gemini.apiKey);
  },

  async embedText(text, options = {}) {
    const cleanText = typeof text === "string" ? text.trim() : "";

    if (!cleanText || !this.isConfigured()) {
      return null;
    }

    const taskType = normalizeTaskType(options.taskType);
    const title = taskType === "RETRIEVAL_DOCUMENT" && options.title
      ? String(options.title).trim().slice(0, 500)
      : null;

    const embedding = await GeminiProvider.embedText({
      text: cleanText,
      taskType,
      title,
    });

    return normalizeEmbedding(embedding);
  },

  async saveChunkEmbedding(chunkId, embedding) {
    const vector = this.toVectorLiteral(embedding);

    if (!vector) {
      return false;
    }

    await prisma.$executeRaw`
      UPDATE "KnowledgeChunk"
      SET embedding = ${vector}::vector
      WHERE id = ${chunkId}
    `;

    return true;
  },

  async embedAndSaveKnowledgeChunk(chunk) {
    try {
      const embedding = await this.embedText(chunk.chunkText, {
        taskType: "RETRIEVAL_DOCUMENT",
        title: chunk.documentTitle || chunk.document?.title || null,
      });

      return this.saveChunkEmbedding(chunk.id, embedding);
    } catch (error) {
      warnEmbeddingSkipped(`${chunk.id}: ${error.message}`);
      return false;
    }
  },

  toVectorLiteral(embedding) {
    const values = normalizeEmbedding(embedding);

    if (!values) {
      return null;
    }

    return `[${values.join(",")}]`;
  },
};

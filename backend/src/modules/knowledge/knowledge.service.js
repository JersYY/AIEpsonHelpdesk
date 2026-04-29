import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireFields } from "../../utils/validators.js";

const chunkContent = (content, maxLength = 900) => {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
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

  return chunks.length ? chunks : [content.trim()];
};

const writeChunks = async (tx, documentId, content) => {
  const chunks = chunkContent(content);

  await tx.knowledgeChunk.createMany({
    data: chunks.map((chunkText, index) => ({
      documentId,
      chunkText,
      metadata: { chunkIndex: index, source: "document-content" },
    })),
  });
};

const includeDocument = {
  category: true,
  suggestedQuestions: true,
  _count: { select: { chunks: true } },
};

export const KnowledgeService = {
  async list(query = {}) {
    return prisma.knowledgeDocument.findMany({
      where: query.categoryId ? { categoryId: query.categoryId } : {},
      orderBy: { updatedAt: "desc" },
      include: includeDocument,
    });
  },

  async getById(id) {
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id },
      include: {
        category: true,
        suggestedQuestions: true,
        chunks: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!document) throw new ApiError(404, "Knowledge document not found");
    return document;
  },

  async create(payload) {
    requireFields(payload, ["title", "content"]);

    if (payload.categoryId) {
      const category = await prisma.issueCategory.findUnique({ where: { id: payload.categoryId } });
      if (!category) throw new ApiError(404, "Issue category not found");
    }

    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.knowledgeDocument.create({
        data: {
          title: payload.title.trim(),
          source: payload.source || null,
          content: payload.content.trim(),
          categoryId: payload.categoryId || null,
        },
      });

      await writeChunks(tx, created.id, created.content);
      return created;
    });

    return this.getById(document.id);
  },

  async update(id, payload) {
    const current = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Knowledge document not found");

    if (payload.categoryId) {
      const category = await prisma.issueCategory.findUnique({ where: { id: payload.categoryId } });
      if (!category) throw new ApiError(404, "Issue category not found");
    }

    const document = await prisma.$transaction(async (tx) => {
      const updated = await tx.knowledgeDocument.update({
        where: { id },
        data: {
          title: payload.title?.trim() ?? current.title,
          source: payload.source === undefined ? current.source : payload.source || null,
          content: payload.content?.trim() ?? current.content,
          categoryId: payload.categoryId === undefined ? current.categoryId : payload.categoryId || null,
        },
      });

      if (payload.content !== undefined) {
        await tx.knowledgeChunk.deleteMany({ where: { documentId: id } });
        await writeChunks(tx, id, updated.content);
      }

      return updated;
    });

    return this.getById(document.id);
  },

  async remove(id) {
    const current = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Knowledge document not found");

    await prisma.knowledgeDocument.delete({ where: { id } });
    return { id, deleted: true };
  },
};

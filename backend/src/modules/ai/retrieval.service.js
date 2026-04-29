import { prisma } from "../../config/prisma.js";
import { EmbeddingService } from "./embedding.service.js";

const keywordSearch = async (query, limit) => {
  const cleanQuery = query?.trim();

  if (cleanQuery) {
    try {
      const rows = await prisma.$queryRaw`
        SELECT
          kc.id,
          kc."documentId",
          kc."chunkText",
          kc.metadata,
          kc."createdAt",
          kd.title AS "documentTitle",
          kd.source,
          ts_rank_cd(to_tsvector('simple', kc."chunkText"), plainto_tsquery('simple', ${cleanQuery})) AS rank
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
        WHERE
          to_tsvector('simple', kc."chunkText") @@ plainto_tsquery('simple', ${cleanQuery})
          OR kc."chunkText" ILIKE ${`%${cleanQuery}%`}
          OR kd.title ILIKE ${`%${cleanQuery}%`}
        ORDER BY rank DESC, kc."createdAt" DESC
        LIMIT ${limit}
      `;

      if (rows.length) return rows;
    } catch {
      const tokens = cleanQuery
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2)
        .slice(0, 6);

      if (tokens.length) {
        const rows = await prisma.knowledgeChunk.findMany({
          where: {
            OR: tokens.map((token) => ({
              chunkText: { contains: token, mode: "insensitive" },
            })),
          },
          include: { document: true },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        if (rows.length) return rows;
      }
    }
  }

  return prisma.knowledgeChunk.findMany({
    include: { document: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

const semanticSearch = async (query, limit) => {
  // TODO(ai-engineer): implement semantic retrieval after embeddings are populated.
  // Intended flow:
  // 1. const embedding = await EmbeddingService.embedText(query, { taskType: "RETRIEVAL_QUERY" })
  // 2. const vector = EmbeddingService.toVectorLiteral(embedding)
  // 3. Query pgvector with ORDER BY kc.embedding <=> ${vector}::vector
  // 4. Return rows with similarity score.
  const embedding = await EmbeddingService.embedText(query, { taskType: "RETRIEVAL_QUERY" });
  const vector = EmbeddingService.toVectorLiteral(embedding);

  if (!vector) {
    return [];
  }

  return [];
};

export const RetrievalService = {
  async searchRelevantChunks(query, limit = 5) {
    const semanticRows = await semanticSearch(query, limit);
    if (semanticRows.length) {
      return semanticRows;
    }

    return keywordSearch(query, limit);
  },
};

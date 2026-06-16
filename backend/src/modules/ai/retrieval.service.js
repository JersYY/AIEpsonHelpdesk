import { aiConfig } from "../../config/ai.js";
import { prisma } from "../../config/prisma.js";
import { EmbeddingService } from "./embedding.service.js";
import { IntentService } from "./intent.service.js";

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(Math.trunc(parsed), 1), 20);
};

const tokenSearch = async (query, limit) => {
  const tokens = IntentService.significantTokens(query).slice(0, 8);
  if (!tokens.length) return [];

  const rows = await prisma.knowledgeChunk.findMany({
    where: {
      OR: tokens.flatMap((token) => [
        { chunkText: { contains: token, mode: "insensitive" } },
        { document: { title: { contains: token, mode: "insensitive" } } },
      ]),
    },
    include: { document: true },
    orderBy: { createdAt: "desc" },
    take: Math.max(limit * 4, limit),
  });

  return IntentService.filterGroundedContexts(
    query,
    rows.map((row) => ({
      ...row,
      documentTitle: row.document?.title,
      source: row.document?.source,
      retrievalMode: "keyword-token",
    })),
  ).slice(0, limit);
};

const keywordSearch = async (query, limit) => {
  const cleanQuery = query?.trim();

  if (!cleanQuery) return [];

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
          ts_rank_cd(to_tsvector('simple', kc."chunkText"), plainto_tsquery('simple', ${cleanQuery})) AS score,
          'keyword' AS "retrievalMode"
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
        WHERE
          to_tsvector('simple', kc."chunkText") @@ plainto_tsquery('simple', ${cleanQuery})
          OR kc."chunkText" ILIKE ${`%${cleanQuery}%`}
          OR kd.title ILIKE ${`%${cleanQuery}%`}
        ORDER BY score DESC, kc."createdAt" DESC
        LIMIT ${limit}
      `;

      if (rows.length) {
        const groundedRows = IntentService.filterGroundedContexts(cleanQuery, rows);
        if (groundedRows.length) return groundedRows;
      }
    } catch {
      return tokenSearch(cleanQuery, limit);
    }
  }

  return tokenSearch(cleanQuery, limit);
};

const semanticSearch = async (query, limit) => {
  const cleanQuery = query?.trim();

  if (!cleanQuery) {
    return [];
  }

  try {
    const embedding = await EmbeddingService.embedText(cleanQuery, { taskType: "RETRIEVAL_QUERY" });
    const vector = EmbeddingService.toVectorLiteral(embedding);

    if (!vector) {
      return [];
    }

    const rows = await prisma.$queryRaw`
      SELECT
        kc.id,
        kc."documentId",
        kc."chunkText",
        kc.metadata,
        kc."createdAt",
        kd.title AS "documentTitle",
        kd.source,
        1 - (kc.embedding <=> ${vector}::vector) AS score,
        'semantic' AS "retrievalMode"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
      WHERE kc.embedding IS NOT NULL
      ORDER BY kc.embedding <=> ${vector}::vector
      LIMIT ${limit}
    `;

    return rows
      .map((row) => ({
        ...row,
        score: row.score === null || row.score === undefined ? null : Number(row.score),
      }))
      .filter((row) => row.score === null || row.score >= aiConfig.rag.minSimilarity);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[ai] semantic retrieval fallback: ${error.message}`);
    }
    return [];
  }
};

export const RetrievalService = {
  async searchRelevantChunks(query, limit = 5) {
    if (IntentService.shouldSkipRetrieval(query)) {
      return [];
    }

    const normalizedLimit = normalizeLimit(limit);
    const shouldUseSemantic = ["semantic", "hybrid"].includes(aiConfig.rag.mode);

    if (shouldUseSemantic) {
      const semanticRows = IntentService.filterGroundedContexts(
        query,
        await semanticSearch(query, normalizedLimit),
      );
      if (semanticRows.length) {
        return semanticRows;
      }
    }

    const keywordRows = IntentService.filterGroundedContexts(
      query,
      await keywordSearch(query, normalizedLimit),
    );
    if (keywordRows.length) {
      return keywordRows;
    }

    return [];
  },
};

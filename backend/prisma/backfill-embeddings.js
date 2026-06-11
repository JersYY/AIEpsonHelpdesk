import { prisma } from "../src/config/prisma.js";
import { EmbeddingService } from "../src/modules/ai/embedding.service.js";

const readNumberArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const envName = name.toUpperCase().replace(/-/g, "_");
  const value = arg ? Number(arg.slice(prefix.length)) : Number(process.env[envName] || fallback);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
};

const batchSize = readNumberArg("batch-size", 25);
const maxChunks = readNumberArg("max-chunks", 1000);

const findChunksWithoutEmbedding = async (limit) => prisma.$queryRaw`
  SELECT
    kc.id,
    kc."chunkText",
    kd.title AS "documentTitle"
  FROM "KnowledgeChunk" kc
  JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
  WHERE kc.embedding IS NULL
  ORDER BY kc."createdAt" ASC
  LIMIT ${limit}
`;

const main = async () => {
  if (!EmbeddingService.isConfigured()) {
    console.log("Embedding dinonaktifkan. Gunakan RAG_MODE=semantic/hybrid dan isi GEMINI_API_KEY jika ingin backfill semantic embedding.");
    return;
  }

  let processed = 0;
  let updated = 0;

  while (processed < maxChunks) {
    const limit = Math.min(batchSize, maxChunks - processed);
    const chunks = await findChunksWithoutEmbedding(limit);

    if (!chunks.length) {
      break;
    }

    for (const chunk of chunks) {
      processed += 1;
      if (await EmbeddingService.embedAndSaveKnowledgeChunk(chunk)) {
        updated += 1;
      }
    }

    console.log(`Backfill progress: processed=${processed}, updated=${updated}`);
  }

  console.log(`Backfill selesai. processed=${processed}, updated=${updated}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

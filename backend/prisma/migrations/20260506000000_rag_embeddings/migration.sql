CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeChunk"
ALTER COLUMN "embedding" TYPE vector(768)
USING CASE
  WHEN "embedding" IS NULL THEN NULL
  WHEN vector_dims("embedding") = 768 THEN "embedding"::vector(768)
  ELSE NULL
END;

CREATE INDEX IF NOT EXISTS "knowledge_chunk_embedding_hnsw_idx"
ON "KnowledgeChunk"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;

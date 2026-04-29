export const EmbeddingService = {
  async embedText(text, options = {}) {
    // TODO(ai-engineer): call Gemini embeddings API with task types:
    // - RETRIEVAL_DOCUMENT for KnowledgeChunk content
    // - RETRIEVAL_QUERY for user query
    // Return a numeric vector with a fixed dimension, for example 768.
    return null;
  },

  toVectorLiteral(embedding) {
    // TODO(ai-engineer): validate dimension consistency before saving to pgvector.
    if (!Array.isArray(embedding) || !embedding.length) {
      return null;
    }

    return `[${embedding.join(",")}]`;
  },
};

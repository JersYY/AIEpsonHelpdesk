import { env } from "./env.js";

const finiteNumber = (value, fallback, { min = null, max = null } = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (min !== null && number < min) return fallback;
  if (max !== null && number > max) return fallback;
  return number;
};

const safetyThreshold = env.GEMINI_SAFETY_THRESHOLD || "BLOCK_MEDIUM_AND_ABOVE";

export const aiConfig = {
  gemini: {
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || "gemini-2.0-flash",
    embeddingModel: env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    embeddingDim: finiteNumber(env.GEMINI_EMBEDDING_DIM, 768, { min: 1 }),
    timeoutMs: finiteNumber(env.GEMINI_TIMEOUT_MS, 15000, { min: 1000 }),
    maxRetries: finiteNumber(env.GEMINI_MAX_RETRIES, 1, { min: 0, max: 5 }),
    temperature: finiteNumber(env.GEMINI_TEMPERATURE, 0.2, { min: 0, max: 2 }),
    maxOutputTokens: finiteNumber(env.GEMINI_MAX_OUTPUT_TOKENS, 700, { min: 1 }),
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: safetyThreshold },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: safetyThreshold },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: safetyThreshold },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: safetyThreshold },
    ],
  },
  rag: {
    minSimilarity: finiteNumber(env.RAG_MIN_SIMILARITY, 0.25, { min: -1, max: 1 }),
  },
  response: {
    minDelayMs: finiteNumber(env.AI_MIN_RESPONSE_MS, 900, { min: 0, max: 10000 }),
  },
};

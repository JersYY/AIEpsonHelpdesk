import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const env = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  GEMINI_EMBEDDING_DIM: Number(process.env.GEMINI_EMBEDDING_DIM || 768),
  GEMINI_TIMEOUT_MS: Number(process.env.GEMINI_TIMEOUT_MS || 15000),
  GEMINI_MAX_RETRIES: Number(process.env.GEMINI_MAX_RETRIES || 1),
  GEMINI_TEMPERATURE: Number(process.env.GEMINI_TEMPERATURE || 0.2),
  GEMINI_MAX_OUTPUT_TOKENS: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 700),
  GEMINI_SAFETY_THRESHOLD: process.env.GEMINI_SAFETY_THRESHOLD || "BLOCK_MEDIUM_AND_ABOVE",
  RAG_MIN_SIMILARITY: Number(process.env.RAG_MIN_SIMILARITY || 0.25),
  AI_MIN_RESPONSE_MS: Number(process.env.AI_MIN_RESPONSE_MS || 900),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT || 1025),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || "helpdesk@epson.local",
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};

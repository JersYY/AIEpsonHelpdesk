import path from "path";

import { aiConfig } from "../../../config/ai.js";
import { readStoredFile } from "../../files/storage.service.js";

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const mimeFromExtension = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
};

const modelPath = (model) => (model.startsWith("models/") ? model : `models/${model}`);
const supportsThinkingConfig = (model) => /gemini-2\.5/i.test(model);

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const isRetryableError = (error) => {
  if (error.name === "AbortError") return true;
  if (error.status === 429) return true;
  if (error.status >= 500) return true;
  return !error.status;
};

const requestJson = async (url, body) => {
  let lastError;
  const attempts = aiConfig.gemini.maxRetries + 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), aiConfig.gemini.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": aiConfig.gemini.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.ok) {
        return response.json();
      }

      const errorText = await response.text();
      const error = new Error(`Gemini request failed with status ${response.status}`);
      error.status = response.status;
      error.details = errorText?.slice(0, 300);
      throw error;
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isRetryableError(error)) {
        throw error;
      }
      await sleep(250 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
};

export const GeminiProvider = {
  async generateAnswer({
    prompt,
    imagePath = null,
    model = aiConfig.gemini.model,
    maxOutputTokens = aiConfig.gemini.maxOutputTokens,
  }) {
    if (!aiConfig.gemini.apiKey) {
      return null;
    }

    const parts = [{ text: prompt }];

    if (imagePath) {
      const storedFile = await readStoredFile(imagePath);
      const mimeType = storedFile.contentType || mimeFromExtension(imagePath);
      if (mimeType) {
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: storedFile.buffer.toString("base64"),
          },
        });
      }
    }

    const generationConfig = {
      temperature: aiConfig.gemini.temperature,
    };

    if (Number.isFinite(Number(maxOutputTokens))) {
      generationConfig.maxOutputTokens = Number(maxOutputTokens);
    }

    if (supportsThinkingConfig(model)) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const data = await requestJson(
      `${GEMINI_API_BASE_URL}/${modelPath(model)}:generateContent`,
      {
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings: aiConfig.gemini.safetySettings,
      },
    );

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n");

    if (!text && data.promptFeedback?.blockReason) {
      throw new Error(`Gemini response blocked: ${data.promptFeedback.blockReason}`);
    }

    return text || null;
  },

  async embedText({ text, taskType = "RETRIEVAL_QUERY", title = null }) {
    if (!aiConfig.gemini.apiKey) {
      return null;
    }

    const body = {
      content: {
        parts: [{ text }],
      },
      taskType,
      outputDimensionality: aiConfig.gemini.embeddingDim,
    };

    if (taskType === "RETRIEVAL_DOCUMENT" && title) {
      body.title = title;
    }

    const data = await requestJson(
      `${GEMINI_API_BASE_URL}/${modelPath(aiConfig.gemini.embeddingModel)}:embedContent`,
      body,
    );

    return data.embedding?.values || null;
  },
};

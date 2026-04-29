import fs from "fs/promises";
import path from "path";

import { env } from "../../../config/env.js";

const mimeFromExtension = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
};

export const GeminiProvider = {
  async generateAnswer({ prompt, imagePath = null }) {
    if (!env.GEMINI_API_KEY) {
      return null;
    }

    // TODO(ai-engineer): move model name, timeout, safety settings, retry policy,
    // and response logging strategy into explicit AI config.
    const parts = [{ text: prompt }];

    if (imagePath) {
      const absolutePath = path.resolve(imagePath);
      const mimeType = mimeFromExtension(absolutePath);
      if (mimeType) {
        const imageBuffer = await fs.readFile(absolutePath);
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: imageBuffer.toString("base64"),
          },
        });
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Gemini request failed");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n");

    return text || null;
  },
};

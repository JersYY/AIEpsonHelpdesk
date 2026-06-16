import { aiConfig } from "../../../config/ai.js";

const trimSlash = (value = "") => String(value).replace(/\/+$/, "");

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const isRetryableError = (error) => {
  if (error.name === "AbortError") return true;
  if (error.status === 429) return true;
  if (error.status >= 500) return true;
  return !error.status;
};

const requestJson = async (body, runtimeConfig) => {
  let lastError;
  const attempts = runtimeConfig.maxRetries + 1;
  const url = `${trimSlash(aiConfig.deepseek.baseUrl)}/chat/completions`;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), runtimeConfig.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiConfig.deepseek.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.ok) {
        return response.json();
      }

      const errorText = await response.text();
      const error = new Error(`DeepSeek request failed with status ${response.status}`);
      error.status = response.status;
      error.details = errorText?.slice(0, 500);
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

export const DeepSeekProvider = {
  async generateAnswer({ prompt, runtimeConfig = {} }) {
    if (!aiConfig.deepseek.apiKey) {
      return null;
    }

    const config = {
      timeoutMs: aiConfig.deepseek.timeoutMs,
      maxRetries: aiConfig.deepseek.maxRetries,
      temperature: aiConfig.deepseek.temperature,
      maxOutputTokens: aiConfig.deepseek.maxOutputTokens,
      thinking: aiConfig.deepseek.thinking,
      ...runtimeConfig,
    };

    const body = {
      model: aiConfig.deepseek.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature,
      stream: false,
    };

    if (Number.isFinite(Number(config.maxOutputTokens))) {
      body.max_tokens = Number(config.maxOutputTokens);
    }

    if (config.thinking && config.thinking !== "disabled") {
      body.thinking = { type: config.thinking };
    }

    const data = await requestJson(body, config);
    const text = data.choices?.[0]?.message?.content;

    return typeof text === "string" && text.trim() ? text.trim() : null;
  },
};

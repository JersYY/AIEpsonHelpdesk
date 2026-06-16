import { aiConfig } from "../../config/ai.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const AI_SETTINGS_KEY = "ai.deepseek";
const CACHE_TTL_MS = 5000;
const ALLOWED_MODES = new Set(["hemat", "normal"]);

let cache = {
  expiresAt: 0,
  settings: null,
};

const normalizeMode = (mode) => {
  const value = String(mode || "").toLowerCase().trim();
  return ALLOWED_MODES.has(value) ? value : "hemat";
};

const modeLabel = (mode) => (mode === "normal" ? "Normal" : "Hemat");

const modeDescription = (mode) =>
  mode === "normal"
    ? "Jawaban lengkap untuk kasus teknis yang butuh konteks panjang tanpa batas token aplikasi."
    : "Jawaban ringkas dengan batas token lebih kecil untuk penggunaan harian yang hemat.";

const autoModelLabel = () => `${aiConfig.deepseek.model} / ${aiConfig.gemini.visionModel}`;

const providerModeConfig = (mode) => {
  const normalized = normalizeMode(mode);
  return {
    timeoutMs: aiConfig.deepseek.timeoutMs,
    maxRetries: aiConfig.deepseek.maxRetries,
    temperature: aiConfig.deepseek.temperature,
    maxOutputTokens: aiConfig.deepseek.maxOutputTokens,
    thinking: aiConfig.deepseek.thinking,
    ...(aiConfig.deepseek.modes[normalized] || {}),
  };
};

const shapeSettings = (value = {}) => {
  const mode = normalizeMode(value.mode || aiConfig.deepseek.mode);
  const runtime = providerModeConfig(mode);

  return {
    provider: "auto",
    providerLabel: "Auto",
    model: autoModelLabel(),
    textProvider: {
      provider: "deepseek",
      label: "DeepSeek",
      model: aiConfig.deepseek.model,
      configured: Boolean(aiConfig.deepseek.apiKey),
    },
    visionProvider: {
      provider: "gemini_vision",
      label: "Gemini Vision",
      model: aiConfig.gemini.visionModel,
      configured: Boolean(aiConfig.gemini.apiKey),
    },
    mode,
    modeLabel: modeLabel(mode),
    modeDescription: modeDescription(mode),
    ragMode: aiConfig.rag.mode,
    configured: Boolean(aiConfig.deepseek.apiKey && aiConfig.gemini.apiKey),
    visionConfigured: Boolean(aiConfig.gemini.apiKey),
    runtime,
    availableModes: ["hemat", "normal"].map((item) => ({
      value: item,
      label: modeLabel(item),
      description: modeDescription(item),
      runtime: providerModeConfig(item),
    })),
  };
};

export const AiSettingsService = {
  async getSettings({ force = false } = {}) {
    if (!force && cache.settings && cache.expiresAt > Date.now()) {
      return cache.settings;
    }

    let row = null;
    if (prisma.appSetting) {
      try {
        row = await prisma.appSetting.findUnique({
          where: { key: AI_SETTINGS_KEY },
        });
      } catch (error) {
        if (!["P2021", "P2022"].includes(error.code)) {
          throw error;
        }
      }
    }
    const settings = shapeSettings(row?.value || {});

    cache = {
      settings,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return settings;
  },

  async updateSettings(payload = {}) {
    const current = await this.getSettings();
    const requestedMode = payload.mode === undefined
      ? current.mode
      : String(payload.mode || "").toLowerCase().trim();

    if (!ALLOWED_MODES.has(requestedMode)) {
      throw new ApiError(400, "AI mode must be hemat or normal");
    }
    const mode = normalizeMode(requestedMode);

    if (!prisma.appSetting) {
      throw new ApiError(500, "Prisma client belum mengenali AppSetting. Jalankan npx prisma generate.");
    }

    try {
      await prisma.appSetting.upsert({
        where: { key: AI_SETTINGS_KEY },
        update: { value: { mode } },
        create: { key: AI_SETTINGS_KEY, value: { mode } },
      });
    } catch (error) {
      if (["P2021", "P2022"].includes(error.code)) {
        throw new ApiError(500, "Tabel AppSetting belum tersedia. Jalankan npx prisma migrate dev.");
      }
      throw error;
    }

    cache.expiresAt = 0;
    return this.getSettings({ force: true });
  },

  runtimeConfig(settings) {
    return providerModeConfig(settings?.mode);
  },

  modeInstruction(settings) {
    return settings?.mode === "normal"
      ? "MODE NORMAL: beri jawaban lengkap sesuai kebutuhan kasus teknis, termasuk langkah, alasan, data yang perlu dikirim, dan catatan eskalasi bila relevan. Jangan membatasi jumlah langkah secara artifisial, tetapi tetap jaga agar jawaban akurat dan mudah dipahami."
      : "MODE HEMAT: jawab lebih padat, prioritaskan 3-4 langkah paling penting, dan hindari penjelasan panjang yang tidak perlu.";
  },
};

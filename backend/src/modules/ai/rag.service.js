import { GenerationService } from "./generation.service.js";
import { PromptService } from "./prompt.service.js";
import { RetrievalService } from "./retrieval.service.js";
import { AiSettingsService } from "./settings.service.js";

export const RagService = {
  async searchRelevantChunks(query, limit = 5) {
    return RetrievalService.searchRelevantChunks(query, limit);
  },

  async generateAnswer({
    message,
    contexts = [],
    imagePath = null,
    intent = null,
    conversationContext = "",
    contextualMessage = "",
  }) {
    const settings = await AiSettingsService.getSettings();
    const prompt = PromptService.buildHelpdeskPrompt({
      message,
      contexts,
      intent,
      conversationContext,
      responseMode: settings.mode,
      responseModeInstruction: AiSettingsService.modeInstruction(settings),
      hasImage: Boolean(imagePath),
      supportsVision: Boolean(imagePath),
    });

    return GenerationService.generateAnswer({
      message,
      prompt,
      contexts,
      imagePath,
      intent,
      settings,
      contextualMessage,
    });
  },
};

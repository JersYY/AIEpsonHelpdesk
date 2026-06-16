import { GenerationService } from "./generation.service.js";
import { IntentService } from "./intent.service.js";
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
    const groundingMessage = contextualMessage || message || "";
    const groundedContexts = IntentService.filterGroundedContexts(groundingMessage, contexts);
    const prompt = PromptService.buildHelpdeskPrompt({
      message,
      contexts: groundedContexts,
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
      contexts: groundedContexts,
      imagePath,
      intent,
      settings,
      contextualMessage,
    });
  },
};

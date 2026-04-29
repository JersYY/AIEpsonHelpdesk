import { GenerationService } from "./generation.service.js";
import { PromptService } from "./prompt.service.js";
import { RetrievalService } from "./retrieval.service.js";

export const RagService = {
  async searchRelevantChunks(query, limit = 5) {
    return RetrievalService.searchRelevantChunks(query, limit);
  },

  async generateAnswer({ message, contexts = [], imagePath = null }) {
    const prompt = PromptService.buildHelpdeskPrompt({ message, contexts });

    return GenerationService.generateAnswer({
      message,
      prompt,
      contexts,
      imagePath,
    });
  },
};

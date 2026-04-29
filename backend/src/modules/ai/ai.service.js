import { RagService } from "./rag.service.js";

export const AiService = {
  async answerHelpdeskQuestion({ message, imagePath = null, limit = 5 }) {
    const contexts = await RagService.searchRelevantChunks(message || "", limit);
    const answer = await RagService.generateAnswer({ message, contexts, imagePath });

    return {
      contexts,
      answer,
    };
  },
};

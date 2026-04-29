import { GeminiProvider } from "./providers/gemini.provider.js";

const mockAnswer = ({ message, contexts }) => {
  const contextLine = contexts.length
    ? `I found ${contexts.length} related knowledge base item(s) to support this answer.`
    : "I could not find a strong knowledge base match, so this is a safe generic troubleshooting response.";

  return [
    "AI troubleshooting response:",
    contextLine,
    `Issue described: ${message || "image-only report"}.`,
    "Recommended next steps: verify the machine status, capture the error code or visible defect, check the related SOP, and escalate if the issue repeats after standard recovery.",
  ].join(" ");
};

export const GenerationService = {
  async generateAnswer({ message, prompt, contexts = [], imagePath = null }) {
    try {
      const geminiText = await GeminiProvider.generateAnswer({ prompt, imagePath });
      if (geminiText) {
        return {
          provider: "gemini",
          text: geminiText,
        };
      }
    } catch (error) {
      // TODO(ai-engineer): replace silent fallback with structured internal AI logs.
      return {
        provider: "mock",
        text: mockAnswer({ message, contexts }),
        error: error.message,
      };
    }

    return {
      provider: "mock",
      text: mockAnswer({ message, contexts }),
    };
  },
};

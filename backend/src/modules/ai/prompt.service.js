const formatContext = (contexts = []) => {
  if (!contexts.length) {
    return "No matching knowledge base context was found.";
  }

  return contexts
    .map((context, index) => {
      const title = context.document?.title || context.documentTitle || "Knowledge";
      const source = context.document?.source || context.source || "Internal knowledge base";
      return `[${index + 1}] ${title}\nSource: ${source}\n${context.chunkText}`;
    })
    .join("\n\n");
};

export const PromptService = {
  buildHelpdeskPrompt({ message, contexts = [] }) {
    // TODO(ai-engineer): tune grounding prompt with Epson production SOP tone,
    // citation format, confidence thresholds, and escalation policy.
    return [
      "You are Epson AI Helpdesk Assistant for internal manufacturing troubleshooting.",
      "Answer from the provided knowledge base context when possible.",
      "If context is insufficient, say what information is missing.",
      "Give concise, safe, step-by-step troubleshooting guidance.",
      "Do not expose API keys, internal secrets, or database details.",
      "",
      `User message:\n${message || "The user uploaded an image without text."}`,
      "",
      `Knowledge context:\n${formatContext(contexts)}`,
    ].join("\n");
  },

  formatContext,
};

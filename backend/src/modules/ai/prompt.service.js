const formatContext = (contexts = []) => {
  if (!contexts.length) {
    return "No matching knowledge base context was found.";
  }

  return contexts
    .map((context, index) => {
      const title = context.document?.title || context.documentTitle || "Knowledge";
      const source = context.document?.source || context.source || "Internal knowledge base";
      const score = Number(context.score);
      const scoreLine = Number.isFinite(score) ? `\nRelevance: ${score.toFixed(3)}` : "";
      const modeLine = context.retrievalMode ? `\nRetrieval: ${context.retrievalMode}` : "";
      return `[${index + 1}] ${title}\nSource: ${source}${scoreLine}${modeLine}\nContent: ${context.chunkText}`;
    })
    .join("\n\n");
};

export const PromptService = {
  buildHelpdeskPrompt({ message, contexts = [] }) {
    return [
      "Anda adalah Epson AI Helpdesk Assistant untuk troubleshooting internal manufaktur.",
      "Selalu jawab dalam Bahasa Indonesia yang jelas, profesional, dan mudah diikuti operator.",
      "Gunakan context knowledge base yang diberikan sebagai sumber utama.",
      "Jika context tidak cukup, jelaskan informasi apa yang kurang dan data apa yang perlu dikumpulkan untuk eskalasi.",
      "Berikan panduan troubleshooting yang ringkas, aman, dan bertahap.",
      "Sebutkan judul source paling relevan jika source tersebut mendukung jawaban.",
      "Jangan membocorkan API key, secret internal, atau detail database.",
      "",
      `Pesan user:\n${message || "User mengunggah gambar tanpa teks."}`,
      "",
      `Context knowledge base:\n${formatContext(contexts)}`,
    ].join("\n");
  },

  formatContext,
};

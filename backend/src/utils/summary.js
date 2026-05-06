export const buildConversationSummary = (messages = []) => {
  if (!messages.length) {
    return "Belum ada riwayat percakapan.";
  }

  const lines = messages
    .slice(-12)
    .map((message) => {
      const imageLabel = message.image
        ? ` [Lampiran gambar: ${message.image.originalName || message.image.storedName}]`
        : "";
      return `${message.sender}: ${message.messageText}${imageLabel}`;
    })
    .join("\n");

  return `Ringkasan percakapan helpdesk terbaru:\n${lines}`;
};

export const titleFromMessage = (message = "Helpdesk Session") => {
  const cleaned = message.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned || "Helpdesk Session";
};

export const buildConversationSummary = (messages = []) => {
  if (!messages.length) {
    return "No conversation history is available yet.";
  }

  const lines = messages
    .slice(-12)
    .map((message) => `${message.sender}: ${message.messageText}`)
    .join("\n");

  return `Summary of recent helpdesk conversation:\n${lines}`;
};

export const titleFromMessage = (message = "Helpdesk Session") => {
  const cleaned = message.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned || "Helpdesk Session";
};

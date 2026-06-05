const cleanText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const truncate = (value = "", max = 520) => {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trim()}...`;
};

const senderLabel = (sender) => {
  if (sender === "USER") return "Pengguna";
  if (sender === "AI") return "AI";
  return "Sistem";
};

const attachmentLabel = (message) => {
  if (!message.image) return null;
  return message.image.originalName || message.image.storedName || "Lampiran gambar";
};

const bullet = (items) => items.filter(Boolean).map((item) => `- ${item}`).join("\n");

export const buildConversationSummary = (messages = [], options = {}) => {
  if (!messages.length) {
    return "Belum ada riwayat percakapan.";
  }

  const userMessages = messages.filter((message) => message.sender === "USER");
  const aiMessages = messages.filter((message) => message.sender === "AI");
  const firstUser = userMessages[0];
  const latestUser = userMessages[userMessages.length - 1];
  const latestAi = aiMessages[aiMessages.length - 1];
  const attachments = messages.map(attachmentLabel).filter(Boolean);
  const requester = options.requester || {};
  const categoryName = options.category?.name || options.categoryName || "Belum dikategorikan";
  const priority = options.priority || "Belum ditentukan";
  const status = options.status || null;

  const history = messages
    .slice(-12)
    .map((message, index) => {
      const image = attachmentLabel(message);
      const suffix = image ? ` (lampiran: ${image})` : "";
      return `${index + 1}. ${senderLabel(message.sender)}: ${truncate(message.messageText, 220)}${suffix}`;
    })
    .join("\n");

  const context = bullet([
    requester.name ? `Pemohon: ${requester.name}${requester.employeeId ? ` (${requester.employeeId})` : ""}` : null,
    requester.department ? `Departemen: ${requester.department}` : null,
    `Kategori: ${categoryName}`,
    `Prioritas: ${priority}`,
    status ? `Status ticket: ${status}` : null,
    `Jumlah pesan: ${messages.length}`,
    attachments.length ? `Lampiran: ${attachments.join(", ")}` : "Lampiran: tidak ada",
  ]);

  return [
    "Ringkasan Ticket Helpdesk",
    "",
    "Masalah utama:",
    `- ${truncate(latestUser?.messageText || firstUser?.messageText || "Belum ada deskripsi masalah.", 420)}`,
    "",
    "Konteks:",
    context,
    "",
    "Respons AI terakhir:",
    `- ${truncate(latestAi?.messageText || "Belum ada respons AI.", 520)}`,
    "",
    "Tindak lanjut untuk helpdesk:",
    "- Validasi kondisi perangkat dan langkah troubleshooting yang sudah dicoba.",
    "- Hubungi pemohon jika perlu akses perangkat, hasil ping, konfigurasi jaringan, atau lampiran tambahan.",
    "- Update status ticket setelah tindakan selesai agar riwayat tetap sinkron.",
    "",
    "Riwayat singkat:",
    history,
  ].join("\n");
};

export const titleFromMessage = (message = "Helpdesk Session") => {
  const cleaned = message.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned || "Helpdesk Session";
};

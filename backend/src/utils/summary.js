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

const titleRules = [
  {
    title: "Printer tidak terdeteksi jaringan",
    keywords: ["tidak terdeteksi", "tidak muncul di jaringan", "printer offline", "offline", "ip", "wi-fi", "wifi", "ethernet", "ping", "print server", "jaringan"],
  },
  {
    title: "Hasil cetak bergaris",
    keywords: ["bergaris", "banding", "missing dot", "missing dots", "nozzle"],
  },
  {
    title: "Kualitas hasil cetak bermasalah",
    keywords: ["hasil cetak", "warna", "pudar", "meleber", "smear", "tinta", "alignment"],
  },
  {
    title: "Kendala scanner ADF",
    keywords: ["adf", "scanner", "scan", "narik dua", "double feed", "kertas miring"],
  },
  {
    title: "Kertas printer macet",
    keywords: ["kertas macet", "paper jam", "nyangkut", "tersangkut"],
  },
  {
    title: "Printer tidak menyala",
    keywords: ["tidak menyala", "tidak nyala", "mati total", "tidak hidup", "no power"],
  },
  {
    title: "Kendala firmware perangkat",
    keywords: ["firmware", "update", "upgrade", "versi"],
  },
  {
    title: "Kendala hardware atau part",
    keywords: ["roller", "sensor", "cover", "tray", "spare part", "part", "hardware"],
  },
];

const hasKeyword = (text, keywords = []) => keywords.some((keyword) => text.includes(keyword));

const compactPromptTitle = (value = "") => {
  let title = cleanText(value)
    .replace(/[?!.]+$/g, "")
    .replace(/\b(tolong|mohon|bantu|dong|ya|min|admin)\b/gi, " ")
    .replace(/\b(printer|scanner|epson)\s+(saya|aku|kami|kita)\b/gi, " ")
    .replace(/\b(saya|aku|kami|kita)\b/gi, " ");

  title = cleanText(title);
  if (!title) return "";
  return title.charAt(0).toUpperCase() + title.slice(1);
};

export const titleFromMessage = (message = "", options = {}) => {
  const cleaned = cleanText(message);
  if (!cleaned && options.hasImage) return "Analisis lampiran gambar";

  const lower = cleaned.toLowerCase();
  const matchedRule = titleRules.find((rule) => hasKeyword(lower, rule.keywords));
  if (matchedRule) return matchedRule.title;

  const compactTitle = compactPromptTitle(cleaned);
  if (compactTitle) return truncate(compactTitle, 52);
  return options.hasImage ? "Analisis lampiran gambar" : "Percakapan helpdesk";
};

const GREETING_WORDS = new Set([
  "hi",
  "hello",
  "hey",
  "halo",
  "hai",
  "helo",
  "permisi",
  "assalamualaikum",
  "morning",
  "afternoon",
  "evening",
  "pagi",
  "siang",
  "sore",
  "malam",
]);

const HELPDESK_KEYWORDS = [
  "adf",
  "alignment",
  "asap",
  "banding",
  "berkedip",
  "black",
  "blinking",
  "cleaning",
  "cyan",
  "daya",
  "defect",
  "dots",
  "epson",
  "error",
  "firmware",
  "garis",
  "hang",
  "hardware",
  "hasil",
  "hidup",
  "hidupkan",
  "ink",
  "ip",
  "jam",
  "jaringan",
  "kabel",
  "kertas",
  "lampu",
  "layar",
  "listrik",
  "macet",
  "maintenance",
  "magenta",
  "mati",
  "menyala",
  "mesin",
  "missing",
  "network",
  "nozzle",
  "nyala",
  "output",
  "panas",
  "panel",
  "paper",
  "part",
  "power",
  "print",
  "printer",
  "responsif",
  "restart",
  "roller",
  "ruangan",
  "rusak",
  "scan",
  "scanner",
  "sensor",
  "sop",
  "stopkontak",
  "terbakar",
  "tinta",
  "tombol",
  "lembap",
  "lembab",
  "troubleshooting",
  "wifi",
  "yellow",
];

const STOPWORDS = new Set([
  "ada",
  "agar",
  "aku",
  "apa",
  "apakah",
  "bagaimana",
  "berapa",
  "bisa",
  "buat",
  "cek",
  "coba",
  "dalam",
  "dan",
  "dengan",
  "di",
  "dong",
  "itu",
  "jadi",
  "jika",
  "kak",
  "kalau",
  "kenapa",
  "ke",
  "kok",
  "lagi",
  "mau",
  "mohon",
  "nya",
  "pada",
  "saat",
  "saya",
  "setelah",
  "tolong",
  "untuk",
  "yang",
]);

const GENERIC_DOMAIN_WORDS = new Set([
  "epson",
  "helpdesk",
  "machine",
  "mesin",
  "printer",
  "scan",
  "scanner",
  "troubleshooting",
]);

const TOKEN_SYNONYMS = {
  adf: ["scanner", "scan", "feed"],
  garis: ["banding", "line"],
  hilang: ["missing"],
  jaringan: ["network"],
  kertas: ["paper"],
  macet: ["jam", "nyangkut", "tersangkut"],
  memindai: ["scan", "scanner"],
  miring: ["skew"],
  produksi: ["production"],
  terdeteksi: ["discovered", "discovery"],
  tinta: ["ink"],
  titik: ["dots", "nozzle"],
};

const ISSUE_TOPICS = {
  scannerPanel: [
    "button",
    "keypad",
    "layar",
    "lembap",
    "lembab",
    "panel",
    "responsif",
    "tidak merespon",
    "tidak responsif",
    "tombol",
    "touch",
  ],
  scanner: [
    "adf",
    "calibration",
    "dokumen",
    "feed",
    "memindai",
    "pickup roller",
    "scan",
    "scanner",
    "separation pad",
  ],
  network: [
    "dhcp",
    "dns",
    "ethernet",
    "gateway",
    "ip",
    "jaringan",
    "network",
    "ping",
    "print server",
    "queue",
    "subnet",
    "terdeteksi",
    "wifi",
  ],
  printQuality: [
    "alignment",
    "banding",
    "cetak",
    "cleaning",
    "cyan",
    "dots",
    "garis",
    "head",
    "ink",
    "magenta",
    "missing",
    "nozzle",
    "output",
    "platen",
    "print quality",
    "tinta",
    "warna",
    "yellow",
  ],
  power: [
    "daya",
    "hidup",
    "listrik",
    "mati",
    "menyala",
    "no power",
    "nyala",
    "power",
    "stopkontak",
  ],
};

const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesTerm = (text, term) => {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;

  if (normalizedTerm.includes(" ")) {
    return text.includes(normalizedTerm);
  }

  if (normalizedTerm.length <= 3) {
    return new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}(?=\\s|$)`).test(text);
  }

  return text.includes(normalizedTerm);
};

const includesAny = (text, words = []) => words.some((word) => includesTerm(text, word));

const contextToText = (context = {}) => [
  context.chunkText,
  context.documentTitle,
  context.document?.title,
  context.source,
  context.document?.source,
].filter(Boolean).join(" ");

const toNumber = (value) => Number(String(value).replace(",", "."));

export const IntentService = {
  isGreetingOnly(message = "") {
    const tokens = String(message)
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    return tokens.length > 0 && tokens.length <= 3 && tokens.every((token) => GREETING_WORDS.has(token));
  },

  calculateSimpleArithmetic(message = "") {
    const normalized = String(message)
      .toLowerCase()
      .replace(/\?/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const match = normalized.match(/^(-?\d+(?:[.,]\d+)?)\s*([+\-*/x:])\s*(-?\d+(?:[.,]\d+)?)(?:\s*(?:berapa|=))?$/);
    if (!match) return null;

    const left = toNumber(match[1]);
    const operator = match[2];
    const right = toNumber(match[3]);

    if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
    if ((operator === "/" || operator === ":") && right === 0) {
      return {
        expression: `${left} ${operator} ${right}`,
        result: "tidak bisa dibagi dengan nol",
      };
    }

    const result = {
      "+": left + right,
      "-": left - right,
      "*": left * right,
      "x": left * right,
      "/": left / right,
      ":": left / right,
    }[operator];

    return {
      expression: `${left} ${operator} ${right}`,
      result: Number.isInteger(result) ? result : Number(result.toFixed(4)),
    };
  },

  isHelpdeskQuestion(message = "") {
    const normalized = String(message).toLowerCase();
    return HELPDESK_KEYWORDS.some((keyword) => normalized.includes(keyword));
  },

  classifyIntent(message = "") {
    const cleanMessage = String(message).trim();
    if (!cleanMessage) return "helpdesk";
    if (this.isGreetingOnly(cleanMessage)) return "greeting";
    if (this.isHelpdeskQuestion(cleanMessage)) return "helpdesk";
    return "other";
  },

  significantTokens(message = "") {
    return normalizeText(message)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
      .filter((token) => !STOPWORDS.has(token))
      .filter((token) => !GENERIC_DOMAIN_WORDS.has(token));
  },

  classifyIssueTopic(message = "") {
    const normalized = normalizeText(message);
    if (!normalized) return null;

    if (
      includesAny(normalized, ["scan", "scanner", "pemindai"])
      && includesAny(normalized, ISSUE_TOPICS.scannerPanel)
    ) return "scannerPanel";
    if (includesAny(normalized, ISSUE_TOPICS.scanner)) return "scanner";
    if (includesAny(normalized, ISSUE_TOPICS.network)) return "network";
    if (includesAny(normalized, ISSUE_TOPICS.printQuality)) return "printQuality";
    if (includesAny(normalized, ISSUE_TOPICS.power)) return "power";
    return null;
  },

  contextMatchesIssueTopic(message = "", context = {}) {
    const topic = this.classifyIssueTopic(message);
    if (!topic) return true;

    const contextText = normalizeText(contextToText(context));
    if (!contextText) return false;

    const topicWords = ISSUE_TOPICS[topic] || [];
    if (!topicWords.length) return true;

    return includesAny(contextText, topicWords);
  },

  contextOverlapScore(message = "", context = {}) {
    const contextText = normalizeText(contextToText(context));
    if (!contextText) return 0;

    const tokens = this.significantTokens(message);
    const tokenScore = tokens.reduce((score, token) => {
      const candidates = [token, ...(TOKEN_SYNONYMS[token] || [])];
      return score + (candidates.some((candidate) => includesTerm(contextText, candidate)) ? 1 : 0);
    }, 0);

    const topic = this.classifyIssueTopic(message);
    const topicScore = topic && this.contextMatchesIssueTopic(message, context) ? 2 : 0;

    return tokenScore + topicScore;
  },

  filterGroundedContexts(message = "", contexts = []) {
    return contexts
      .map((context) => ({
        context,
        relevanceScore: this.contextOverlapScore(message, context),
      }))
      .filter(({ context, relevanceScore }) =>
        relevanceScore > 0 && this.contextMatchesIssueTopic(message, context),
      )
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ context, relevanceScore }) => ({
        ...context,
        score: Number.isFinite(Number(context.score)) ? context.score : relevanceScore,
      }));
  },

  hasGroundedContext(message = "", contexts = []) {
    if (!contexts.length) return false;
    return this.filterGroundedContexts(message, contexts).length > 0;
  },

  shouldSkipRetrieval(message = "") {
    const cleanMessage = String(message).trim();
    if (!cleanMessage) return true;

    return (
      this.isGreetingOnly(cleanMessage)
      || Boolean(this.calculateSimpleArithmetic(cleanMessage))
      || !this.isHelpdeskQuestion(cleanMessage)
    );
  },
};

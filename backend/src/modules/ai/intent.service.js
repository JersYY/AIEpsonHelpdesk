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
  "paper",
  "part",
  "power",
  "print",
  "printer",
  "restart",
  "roller",
  "rusak",
  "scan",
  "scanner",
  "sensor",
  "sop",
  "stopkontak",
  "terbakar",
  "tinta",
  "tombol",
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
  garis: ["banding", "line"],
  hilang: ["missing"],
  jaringan: ["network"],
  kertas: ["paper"],
  macet: ["jam"],
  miring: ["skew"],
  produksi: ["production"],
  terdeteksi: ["discovered", "discovery"],
  tinta: ["ink"],
  titik: ["dots", "nozzle"],
};

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
    return String(message)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
      .filter((token) => !STOPWORDS.has(token))
      .filter((token) => !GENERIC_DOMAIN_WORDS.has(token));
  },

  hasGroundedContext(message = "", contexts = []) {
    if (!contexts.length) return false;

    const tokens = this.significantTokens(message);
    if (!tokens.length) return true;

    const contextText = contexts
      .map((context) => [
        context.chunkText,
        context.documentTitle,
        context.document?.title,
        context.source,
        context.document?.source,
      ].filter(Boolean).join(" "))
      .join(" ")
      .toLowerCase();

    return tokens.some((token) => {
      const candidates = [token, ...(TOKEN_SYNONYMS[token] || [])];
      return candidates.some((candidate) => contextText.includes(candidate));
    });
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

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
  "gambar",
  "hang",
  "hardware",
  "hasil",
  "hdmi",
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
  "projector",
  "proyektor",
  "print",
  "printer",
  "responsif",
  "restart",
  "reset",
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
  "axis",
  "barcode",
  "black mark",
  "controller",
  "direct view",
  "e-stop",
  "gap sensor",
  "gripper",
  "kasir",
  "label",
  "large format",
  "led display",
  "micro device",
  "microdevice",
  "moverio",
  "plotter",
  "pos",
  "printer struk",
  "receipt",
  "robot",
  "robotika",
  "scara",
  "signage",
  "smart glasses",
  "smartglass",
  "struk",
  "surecolor",
  "thermal",
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
  berkedip: ["flicker", "blink"],
  garis: ["banding", "line"],
  gambar: ["display", "image", "projection"],
  gripper: ["end effector"],
  hilang: ["missing"],
  hdmi: ["display", "input"],
  jaringan: ["network"],
  kertas: ["paper"],
  label: ["barcode", "gap sensor", "black mark"],
  led: ["direct view", "display", "signage"],
  macet: ["jam", "nyangkut", "tersangkut"],
  memindai: ["scan", "scanner"],
  moverio: ["smartglass", "smart glasses", "kacamata"],
  miring: ["skew"],
  pos: ["receipt", "struk", "kasir", "thermal"],
  produksi: ["production"],
  robot: ["robotika", "scara", "6-axis", "servo"],
  robotika: ["robot", "scara", "6-axis", "servo"],
  scara: ["robot", "robotika", "axis"],
  smartglass: ["moverio", "smart glasses", "kacamata"],
  struk: ["receipt", "pos", "thermal"],
  surecolor: ["large format", "wide format", "plotter"],
  terdeteksi: ["discovered", "discovery"],
  tinta: ["ink"],
  titik: ["dots", "nozzle"],
};

const ISSUE_TOPICS = {
  robot: [
    "6-axis",
    "axis",
    "controller",
    "e-stop",
    "emergency stop",
    "gripper",
    "pendant",
    "robot",
    "robotika",
    "safety gate",
    "scara",
    "servo",
    "teach pendant",
  ],
  smartGlasses: [
    "display",
    "kacamata",
    "kacamata pintar",
    "moverio",
    "smart glasses",
    "smartglass",
    "touchpad",
    "type-c",
    "usb-c",
  ],
  pos: [
    "cash drawer",
    "cutter",
    "kasir",
    "point of sale",
    "pos",
    "printer struk",
    "receipt",
    "struk",
    "thermal",
    "tm-t",
  ],
  labelPrinter: [
    "barcode",
    "black mark",
    "feed",
    "gap",
    "gap sensor",
    "label",
    "media guide",
    "roll",
    "sensor label",
  ],
  largeFormat: [
    "calibration",
    "large format",
    "media profile",
    "plotter",
    "roll paper",
    "surecolor",
    "wide format",
  ],
  ledDisplay: [
    "direct view",
    "dv led",
    "led display",
    "module led",
    "panel led",
    "signage",
  ],
  microdevice: [
    "board",
    "crystal",
    "micro device",
    "microdevice",
    "modul",
    "module",
    "oscillator",
    "sensor module",
  ],
  projector: [
    "berkedip",
    "display",
    "flicker",
    "gambar",
    "hdmi",
    "image",
    "input",
    "lampu",
    "lembap",
    "lembab",
    "meeting",
    "projector",
    "projection",
    "proyektor",
    "ruang",
    "ruangan",
    "ventilasi",
  ],
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
  scannerMaintenance: [
    "bersih",
    "bersihkan",
    "calibration",
    "clean",
    "cleaning",
    "kaca",
    "kalibrasi",
    "lama tidak digunakan",
    "paper path",
    "pemeliharaan",
    "reset",
    "restart",
    "test scan",
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

const REQUIRED_CONTEXT_TERMS = {
  robot: ["6-axis", "robot", "robotika", "scara"],
  smartGlasses: ["kacamata", "moverio", "smart glasses", "smartglass"],
  pos: ["kasir", "point of sale", "pos", "receipt", "struk", "tm-t"],
  labelPrinter: ["barcode", "black mark", "gap sensor", "label"],
  largeFormat: ["large format", "plotter", "surecolor", "wide format"],
  ledDisplay: ["direct view", "dv led", "led display", "panel led", "signage"],
  microdevice: ["micro device", "microdevice", "modul", "module", "oscillator"],
  projector: ["projector", "proyektor"],
  scannerPanel: ["scan", "scanner", "pemindai"],
  scannerMaintenance: ["scan", "scanner", "pemindai"],
  scanner: ["adf", "scan", "scanner"],
  network: ["ip", "jaringan", "network", "print server", "queue", "subnet", "wifi"],
  printQuality: ["banding", "cetak", "garis", "nozzle", "print quality"],
  power: ["daya", "listrik", "mati", "menyala", "power"],
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

    if (includesAny(normalized, ["robot", "robotika", "scara", "6-axis", "six-axis"])) return "robot";
    if (includesAny(normalized, ["moverio", "smart glasses", "smartglass", "kacamata pintar"])) return "smartGlasses";
    if (includesAny(normalized, ["point of sale", "pos", "printer struk", "receipt", "struk", "tm-t"])) return "pos";
    if (includesAny(normalized, ["barcode", "black mark", "gap sensor", "label"])) return "labelPrinter";
    if (includesAny(normalized, ["large format", "plotter", "surecolor", "wide format"])) return "largeFormat";
    if (includesAny(normalized, ["direct view", "dv led", "led display", "panel led", "signage"])) return "ledDisplay";
    if (includesAny(normalized, ["micro device", "microdevice", "modul sensor", "oscillator"])) return "microdevice";
    if (
      includesAny(normalized, ["projector", "proyektor"])
    ) return "projector";
    if (
      includesAny(normalized, ["scan", "scanner", "pemindai"])
      && includesAny(normalized, ISSUE_TOPICS.scannerPanel)
    ) return "scannerPanel";
    if (
      includesAny(normalized, ["scan", "scanner", "pemindai"])
      && includesAny(normalized, ISSUE_TOPICS.scannerMaintenance)
    ) return "scannerMaintenance";
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

    const requiredTerms = REQUIRED_CONTEXT_TERMS[topic] || [];
    if (requiredTerms.length && !includesAny(contextText, requiredTerms)) {
      return false;
    }

    return includesAny(contextText, topicWords);
  },

  contextRelevanceDetails(message = "", context = {}) {
    const contextText = normalizeText(contextToText(context));
    if (!contextText) {
      return {
        topic: null,
        tokenScore: 0,
        topicScore: 0,
        totalScore: 0,
      };
    }

    const tokens = this.significantTokens(message);
    const tokenScore = tokens.reduce((score, token) => {
      const candidates = [token, ...(TOKEN_SYNONYMS[token] || [])];
      return score + (candidates.some((candidate) => includesTerm(contextText, candidate)) ? 1 : 0);
    }, 0);

    const topic = this.classifyIssueTopic(message);
    const topicScore = topic && this.contextMatchesIssueTopic(message, context) ? 2 : 0;

    return {
      topic,
      tokenScore,
      topicScore,
      totalScore: tokenScore + topicScore,
    };
  },

  contextOverlapScore(message = "", context = {}) {
    return this.contextRelevanceDetails(message, context).totalScore;
  },

  isStrictlyGroundedContext(message = "", context = {}) {
    const details = this.contextRelevanceDetails(message, context);
    if (details.totalScore <= 0) return false;

    if (!details.topic) {
      return details.tokenScore > 0;
    }

    return details.topicScore > 0 && details.tokenScore > 0;
  },

  filterGroundedContexts(message = "", contexts = []) {
    return contexts
      .map((context) => ({
        context,
        relevanceScore: this.contextOverlapScore(message, context),
      }))
      .filter(({ context, relevanceScore }) =>
        relevanceScore > 0 && this.isStrictlyGroundedContext(message, context),
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

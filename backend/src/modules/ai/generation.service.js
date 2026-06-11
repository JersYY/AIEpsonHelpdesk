import { aiConfig } from "../../config/ai.js";
import { IntentService } from "./intent.service.js";
import { DeepSeekProvider } from "./providers/deepseek.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { AiSettingsService } from "./settings.service.js";

const contextTitle = (context) =>
  context?.documentTitle || context?.document?.title || "knowledge base";

const SAFETY_NOTE =
  "Jika tercium bau terbakar, ada asap, kabel rusak, percikan api, atau cairan masuk, segera cabut kabel daya, jangan membongkar perangkat, dan hubungi teknisi/servis resmi sebelum mencoba menyalakannya kembali.";

const buildGreetingAnswer = () =>
  [
    "Silakan jelaskan kendala pada printer, scanner, jaringan, firmware, atau perangkat Epson lain.",
    "Sertakan gejala, lokasi perangkat, kode error jika ada, dan langkah yang sudah dicoba agar pengecekan lebih tepat.",
  ].join(" ");

const buildOutOfScopeAnswer = () =>
  [
    "Maaf, sepertinya pertanyaan ini di luar topik perangkat Epson.",
    "Saya bisa membantu troubleshooting printer, scanner, jaringan, firmware, hardware, atau part Epson.",
    "Silakan jelaskan kendala perangkat Anda, dan saya bantu cek langkahnya.",
  ].join(" ");

// Langkah aman umum untuk printer mati / tidak menyala.
const buildPowerIssueAnswer = () =>
  [
    "Baik, saya bantu cek printer Epson Anda yang tidak menyala. Silakan coba langkah awal berikut:",
    "1. Pastikan kabel daya terpasang rapat pada printer dan stopkontak.",
    "2. Coba gunakan stopkontak lain yang dipastikan berfungsi.",
    "3. Jika menggunakan terminal listrik atau stabilizer, sambungkan printer langsung ke stopkontak.",
    "4. Cabut kabel daya selama 1 menit, lalu sambungkan kembali dan tekan tombol power.",
    "5. Periksa apakah ada lampu indikator, suara, atau layar yang menyala.",
    "",
    "Mohon informasikan:",
    "1. Model printer Epson Anda.",
    "2. Apakah tidak ada lampu sama sekali, atau ada lampu yang berkedip?",
    "3. Apakah sebelumnya terjadi mati listrik, terkena cairan, atau tercium bau terbakar?",
    "",
    SAFETY_NOTE,
  ].join("\n");

const buildPaperJamAnswer = () =>
  [
    "Baik, saya bantu cek masalah kertas macet pada printer Epson Anda. Silakan coba langkah awal berikut:",
    "1. Matikan printer terlebih dahulu agar aman sebelum mengeluarkan kertas.",
    "2. Buka penutup printer dan tarik kertas yang macet perlahan searah jalur keluar kertas, hindari menyobeknya.",
    "3. Pastikan tidak ada sisa potongan kertas, klip, atau benda asing di jalur kertas.",
    "4. Periksa kondisi roller dan tray kertas, lalu muat ulang kertas dengan rapi sesuai batas maksimal.",
    "5. Nyalakan kembali printer dan coba cetak satu halaman uji.",
    "",
    "Mohon informasikan:",
    "1. Model printer Epson Anda.",
    "2. Apakah muncul kode error atau lampu indikator tertentu saat macet?",
    "3. Di bagian mana kertas tersangkut (input, dalam printer, atau output)?",
  ].join("\n");

const buildGenericTroubleshootingAnswer = (message) =>
  [
    `Baik, saya bantu cek kendala "${message}" pada perangkat Epson Anda. Silakan mulai dari langkah awal yang aman berikut:`,
    "1. Pastikan perangkat dalam kondisi menyala dan kabel daya terpasang dengan benar.",
    "2. Periksa lampu indikator, layar, atau pesan error yang muncul.",
    "3. Coba matikan perangkat sekitar 1 menit, lalu nyalakan kembali (restart).",
    "4. Pastikan kabel data/jaringan dan konsumabel (tinta, kertas) terpasang dengan baik.",
    "",
    "Mohon informasikan:",
    "1. Model perangkat Epson Anda.",
    "2. Kode error atau gejala persis yang muncul (mis. lampu berkedip, bunyi, hasil cetak).",
    "3. Tindakan apa yang sudah Anda coba sebelumnya?",
    "",
    SAFETY_NOTE,
  ].join("\n");

const buildImageFallbackAnswer = (message = "") => {
  if (isImageIdentityQuestion(message)) {
    return [
      "Saya belum bisa memastikan tipe atau model printer hanya dari gambar ini.",
      "Agar tidak salah identifikasi, mohon kirim foto yang lebih jelas pada bagian label model, panel depan, atau stiker serial number.",
      "Biasanya informasi model Epson terlihat di bagian depan perangkat, dekat panel tombol, atau pada stiker belakang/bawah unit.",
    ].join("\n");
  }

  return [
    "Saya menerima gambar yang Anda lampirkan, tetapi belum bisa memastikan detail teknisnya dengan aman.",
    "Mohon tambahkan informasi model perangkat, gejala yang muncul, kode error/lampu indikator, dan tindakan yang sudah dicoba.",
    "Jika gambar menunjukkan kerusakan fisik, cairan, asap, atau kabel rusak, hentikan penggunaan perangkat dan eskalasikan ke helpdesk/teknisi resmi.",
  ].join("\n");
};

const isImageIdentityQuestion = (message = "") => {
  const text = String(message || "").toLowerCase();
  return ["tipe", "model", "seri", "jenis", "apa"].some((word) =>
    text.includes(word),
  );
};

const isPowerIssue = (message = "") => {
  const text = message.toLowerCase();
  const powerWords = [
    "mati",
    "tidak menyala",
    "tidak nyala",
    "tdk nyala",
    "gak nyala",
    "ga nyala",
    "tidak hidup",
    "tidak bisa nyala",
    "tidak mau nyala",
    "no power",
    "won't turn on",
    "tidak menyala sama sekali",
  ];
  return powerWords.some((word) => text.includes(word));
};

const isPaperJam = (message = "") => {
  const text = message.toLowerCase();
  const jamWords = [
    "kertas macet",
    "macet",
    "paper jam",
    "nyangkut",
    "tersangkut",
    "kertas nyangkut",
  ];
  return jamWords.some((word) => text.includes(word));
};

const buildGroundedMockAnswer = ({ message, contexts }) => {
  const topContext = contexts[0];
  const title = contextTitle(topContext);
  const text = String(topContext?.chunkText || "").toLowerCase();

  if (
    text.includes("banding") ||
    text.includes("nozzle") ||
    text.includes("missing dots")
  ) {
    return [
      "Untuk kasus print quality seperti ini, mulai dari pengecekan dasar dulu.",
      "Cek hasil nozzle check, status ink supply, kebersihan platen, dan alignment media.",
      "Jangan langsung melakukan head cleaning berulang sebelum memastikan ink path dan maintenance tank aman.",
      `Acuan saya: ${title}. Jika defect masih muncul setelah cleaning dan alignment standar, siapkan sample output, serial number printer, lot tinta, dan kondisi lingkungan untuk eskalasi.`,
    ].join("\n");
  }

  if (
    text.includes("adf") ||
    text.includes("scanner") ||
    text.includes("jam")
  ) {
    return [
      "Untuk masalah ADF atau scanner, hentikan job dulu lalu keluarkan kertas mengikuti arah feed.",
      "Setelah itu cek separation pad, pickup roller, debu di paper path, dan lakukan calibration scan.",
      `Acuan saya: ${title}. Kalau sensor ADF masih aktif setelah jalur kertas bersih, catat status sensor dan lampirkan foto area feed saat eskalasi.`,
    ].join("\n");
  }

  if (
    text.includes("network") ||
    text.includes("ip address") ||
    text.includes("subnet")
  ) {
    return [
      "Untuk printer yang tidak terdeteksi di jaringan, cek dari sisi koneksi fisik dan konfigurasi IP dulu.",
      "Pastikan link light menyala, IP address benar, subnet/gateway/DNS sesuai, dan print server queue tidak bermasalah.",
      `Acuan saya: ${title}. Jika perlu eskalasi, lampirkan hasil ping dan network report device.`,
    ].join("\n");
  }

  return [
    `Berdasarkan ${title}, mulai dari pengecekan kondisi mesin dan gejala yang paling jelas.`,
    "Catat kode error, perubahan terakhir sebelum masalah muncul, dan bukti visual jika ada.",
    "Jika recovery standar tidak menyelesaikan masalah, siapkan data tersebut untuk eskalasi ke helpdesk.",
  ].join("\n");
};

// Troubleshooting umum yang aman saat tidak ada artikel knowledge base spesifik.
const buildSafeFallbackAnswer = (message = "") => {
  const cleanMessage = String(message).trim();

  if (isPowerIssue(cleanMessage)) return buildPowerIssueAnswer();
  if (isPaperJam(cleanMessage)) return buildPaperJamAnswer();

  return buildGenericTroubleshootingAnswer(
    cleanMessage || "perangkat Epson Anda",
  );
};

const mockAnswer = ({
  message,
  contexts,
  intent: providedIntent = null,
  imagePath = null,
}) => {
  const arithmetic = IntentService.calculateSimpleArithmetic(message);
  if (arithmetic) {
    return `Hasilnya ${arithmetic.result}. Jika ada pertanyaan troubleshooting Epson, jelaskan gejala mesin atau defect yang muncul agar saya bisa cek knowledge base.`;
  }

  const intent = providedIntent || IntentService.classifyIntent(message || "");

  if (intent === "greeting") {
    return buildGreetingAnswer();
  }

  if (intent === "other") {
    return buildOutOfScopeAnswer();
  }

  if (imagePath && (isImageIdentityQuestion(message) || !contexts.length)) {
    return buildImageFallbackAnswer(message);
  }

  // Intent helpdesk: utamakan artikel knowledge base spesifik bila benar-benar cocok.
  if (contexts.length && IntentService.hasGroundedContext(message, contexts)) {
    return buildGroundedMockAnswer({ message, contexts });
  }

  // Belum ada artikel spesifik: tetap berikan langkah awal aman + pertanyaan klarifikasi.
  return buildSafeFallbackAnswer(message);
};

export const GenerationService = {
  async generateAnswer({
    message,
    prompt,
    contexts = [],
    imagePath = null,
    intent = null,
    settings = null,
  }) {
    const resolvedSettings = settings || await AiSettingsService.getSettings();
    const runtimeConfig = AiSettingsService.runtimeConfig(resolvedSettings);
    const provider = imagePath ? "gemini_vision" : "deepseek";

    try {
      const aiText = provider === "deepseek"
        ? await DeepSeekProvider.generateAnswer({ prompt, imagePath, runtimeConfig })
        : await GeminiProvider.generateAnswer({
            prompt,
            imagePath,
            model: aiConfig.gemini.visionModel,
          });

      if (aiText) {
        return {
          provider,
          text: aiText,
          mode: resolvedSettings.mode,
        };
      }
    } catch (error) {
      // TODO(ai-engineer): replace silent fallback with structured internal AI logs.
      console.error(`[${provider}] generate failed:`, {
        message: error.message,
        status: error.status,
        details: error.details,
      });

      return {
        provider: "mock",
        text: mockAnswer({ message, contexts, intent, imagePath }),
        error: error.message,
        mode: resolvedSettings.mode,
      };
    }

    return {
      provider: "mock",
      text: mockAnswer({ message, contexts, intent, imagePath }),
      mode: resolvedSettings.mode,
    };
  },
};

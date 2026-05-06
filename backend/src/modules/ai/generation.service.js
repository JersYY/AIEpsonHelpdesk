import { GeminiProvider } from "./providers/gemini.provider.js";
import { IntentService } from "./intent.service.js";

const contextTitle = (context) => context?.documentTitle || context?.document?.title || "knowledge base";

const buildInsufficientContextAnswer = (message) => [
  `Saya belum menemukan informasi yang cukup spesifik tentang "${message}" di knowledge base Epson Helpdesk.`,
  "Kalau ini terkait mesin Epson, kirimkan konteks tambahan seperti model mesin, kode error, gejala yang terlihat, dan tindakan terakhir yang sudah dilakukan.",
].join(" ");

const buildGroundedMockAnswer = ({ message, contexts }) => {
  const topContext = contexts[0];
  const title = contextTitle(topContext);
  const text = String(topContext?.chunkText || "").toLowerCase();

  if (text.includes("banding") || text.includes("nozzle") || text.includes("missing dots")) {
    return [
      "Untuk kasus print quality seperti ini, mulai dari pengecekan dasar dulu.",
      "Cek hasil nozzle check, status ink supply, kebersihan platen, dan alignment media.",
      "Jangan langsung melakukan head cleaning berulang sebelum memastikan ink path dan maintenance tank aman.",
      `Acuan saya: ${title}. Jika defect masih muncul setelah cleaning dan alignment standar, siapkan sample output, serial number printer, lot tinta, dan kondisi lingkungan untuk eskalasi.`,
    ].join("\n");
  }

  if (text.includes("adf") || text.includes("scanner") || text.includes("jam")) {
    return [
      "Untuk masalah ADF atau scanner, hentikan job dulu lalu keluarkan kertas mengikuti arah feed.",
      "Setelah itu cek separation pad, pickup roller, debu di paper path, dan lakukan calibration scan.",
      `Acuan saya: ${title}. Kalau sensor ADF masih aktif setelah jalur kertas bersih, catat status sensor dan lampirkan foto area feed saat eskalasi.`,
    ].join("\n");
  }

  if (text.includes("network") || text.includes("ip address") || text.includes("subnet")) {
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

const mockAnswer = ({ message, contexts }) => {
  const arithmetic = IntentService.calculateSimpleArithmetic(message);
  if (arithmetic) {
    return `Hasilnya ${arithmetic.result}. Jika ada pertanyaan troubleshooting Epson, jelaskan gejala mesin atau defect yang muncul agar saya bisa cek knowledge base.`;
  }

  if (IntentService.isGreetingOnly(message)) {
    return [
      "Halo, saya Epson AI Helpdesk Assistant.",
      "Jelaskan masalah printer, scanner, jaringan, firmware, hardware, atau part yang sedang terjadi.",
      "Sertakan kode error, defect yang terlihat, tindakan maintenance terakhir, dan kondisi mesin agar saya bisa mengecek knowledge base terlebih dahulu.",
    ].join(" ");
  }

  if (message && !IntentService.isHelpdeskQuestion(message)) {
    return [
      "Pertanyaan tersebut di luar cakupan Epson AI Helpdesk.",
      "Saya bisa membantu troubleshooting printer, scanner, jaringan, firmware, hardware, part, atau defect produksi.",
      "Silakan jelaskan gejala, kode error, kondisi mesin, dan tindakan terakhir yang sudah dilakukan.",
    ].join(" ");
  }

  if (contexts.length && !IntentService.hasGroundedContext(message, contexts)) {
    return buildInsufficientContextAnswer(message);
  }

  if (contexts.length) {
    return buildGroundedMockAnswer({ message, contexts });
  }

  return buildInsufficientContextAnswer(message || "laporan ini");
};

export const GenerationService = {
  async generateAnswer({ message, prompt, contexts = [], imagePath = null }) {
    try {
      const geminiText = await GeminiProvider.generateAnswer({ prompt, imagePath });
      if (geminiText) {
        return {
          provider: "gemini",
          text: geminiText,
        };
      }
    } catch (error) {
      // TODO(ai-engineer): replace silent fallback with structured internal AI logs.
      return {
        provider: "mock",
        text: mockAnswer({ message, contexts }),
        error: error.message,
      };
    }

    return {
      provider: "mock",
      text: mockAnswer({ message, contexts }),
    };
  },
};

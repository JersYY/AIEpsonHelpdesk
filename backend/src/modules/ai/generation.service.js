import { aiConfig } from "../../config/ai.js";
import { IntentService } from "./intent.service.js";
import { DeepSeekProvider } from "./providers/deepseek.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { AiSettingsService } from "./settings.service.js";

const SAFETY_NOTE =
  "Jika tercium bau terbakar, ada asap, kabel rusak, percikan api, atau cairan masuk, segera cabut kabel daya, jangan membongkar perangkat, dan hubungi teknisi/servis resmi sebelum mencoba menyalakannya kembali.";

const buildGreetingAnswer = () =>
  [
    "**Halo, saya Epson AI Helpdesk.**",
    "",
    "Silakan jelaskan kendala perangkat Epson di area kerja Anda.",
    "",
    "**Data yang membantu:**",
    "- Departemen/area dan lokasi perangkat.",
    "- Model perangkat, serial number, atau asset tag jika tersedia.",
    "- Kode error, gejala utama, dan langkah yang sudah dicoba.",
  ].join("\n");

const buildOutOfScopeAnswer = () =>
  [
    "**Di luar cakupan helpdesk Epson.**",
    "",
    "Saya bisa membantu troubleshooting perangkat Epson seperti printer, scanner, proyektor, robotika, Moverio/smart glasses, POS/receipt printer, label printer, SureColor/large format, Direct View LED/display, microdevice, jaringan, firmware, hardware, atau part.",
    "",
    "**Silakan kirim:**",
    "- Jenis perangkat dan modelnya.",
    "- Gejala atau kode error.",
    "- Lokasi perangkat dan langkah yang sudah dicoba.",
  ].join("\n");

// Langkah aman umum untuk printer mati / tidak menyala.
const buildPowerIssueAnswer = () =>
  [
    "**Printer Tidak Menyala**",
    "",
    "Baik, saya bantu cek langkah awal yang aman.",
    "",
    "**Langkah pengecekan:**",
    "1. Pastikan kabel daya terpasang rapat pada printer dan stopkontak.",
    "2. Coba gunakan stopkontak lain yang dipastikan berfungsi.",
    "3. Jika menggunakan terminal listrik atau stabilizer, sambungkan printer langsung ke stopkontak.",
    "4. Cabut kabel daya selama 1 menit, lalu sambungkan kembali dan tekan tombol power.",
    "5. Periksa apakah ada lampu indikator, suara, atau layar yang menyala.",
    "",
    "**Data yang perlu dikirim:**",
    "- Model printer, serial number, atau asset tag.",
    "- Kondisi indikator: tidak ada lampu sama sekali atau ada lampu berkedip.",
    "- Riwayat sebelum masalah: mati listrik, terkena cairan, panas, atau bau terbakar.",
    "",
    `*Catatan keselamatan:* ${SAFETY_NOTE}`,
  ].join("\n");

const buildPaperJamAnswer = () =>
  [
    "**Kertas Macet pada Printer**",
    "",
    "Baik, coba lakukan pengecekan awal berikut.",
    "",
    "**Langkah pengecekan:**",
    "1. Matikan printer terlebih dahulu agar aman sebelum mengeluarkan kertas.",
    "2. Buka penutup printer dan tarik kertas yang macet perlahan searah jalur keluar kertas, hindari menyobeknya.",
    "3. Pastikan tidak ada sisa potongan kertas, klip, atau benda asing di jalur kertas.",
    "4. Periksa kondisi roller dan tray kertas, lalu muat ulang kertas dengan rapi sesuai batas maksimal.",
    "5. Nyalakan kembali printer dan coba cetak satu halaman uji.",
    "",
    "**Data yang perlu dikirim:**",
    "- Model printer dan lokasi perangkat.",
    "- Kode error atau pola lampu indikator.",
    "- Posisi kertas tersangkut: input, dalam printer, atau output.",
  ].join("\n");

const buildGenericTroubleshootingAnswer = (message) =>
  [
    "**Pengecekan Awal Perangkat Epson**",
    "",
    `Saya bantu cek kendala: "${message}".`,
    "",
    "**Langkah awal:**",
    "1. Pastikan perangkat dalam kondisi menyala dan kabel daya terpasang dengan benar.",
    "2. Periksa lampu indikator, layar, atau pesan error yang muncul.",
    "3. Coba matikan perangkat sekitar 1 menit, lalu nyalakan kembali (restart).",
    "4. Pastikan kabel data/jaringan dan konsumabel (tinta, kertas) terpasang dengan baik.",
    "",
    "**Data yang perlu dikirim:**",
    "- Departemen/area dan lokasi perangkat.",
    "- Model perangkat Epson serta serial number atau asset tag jika tersedia.",
    "- Kode error/gejala persis dan tindakan yang sudah dicoba sebelumnya.",
    "",
    `*Catatan keselamatan:* ${SAFETY_NOTE}`,
  ].join("\n");

const buildImageFallbackAnswer = (message = "") => {
  if (isImageIdentityQuestion(message)) {
    return [
      "**Identifikasi Model Belum Pasti**",
      "",
      "Saya belum bisa memastikan tipe atau model perangkat Epson hanya dari gambar ini.",
      "",
      "**Mohon kirim ulang:**",
      "- Foto label model, panel depan, atau stiker serial number.",
      "- Foto dengan pencahayaan cukup dan tidak blur.",
      "- Lokasi perangkat atau asset tag jika tersedia.",
    ].join("\n");
  }

  return [
    "**Gambar Diterima**",
    "",
    "Saya menerima gambar yang Anda lampirkan, tetapi belum bisa memastikan detail teknisnya dengan aman.",
    "",
    "**Mohon tambahkan:**",
    "- Model perangkat dan lokasi/area.",
    "- Gejala yang muncul serta kode error/lampu indikator.",
    "- Langkah yang sudah dicoba.",
    "",
    "*Jika terlihat kerusakan fisik, cairan, asap, atau kabel rusak, hentikan penggunaan dan eskalasikan ke helpdesk/teknisi resmi.*",
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

const isProjectorIssue = (message = "") => {
  const text = message.toLowerCase();
  const projectorWords = ["projector", "proyektor"];
  const issueWords = [
    "berkedip",
    "display",
    "flicker",
    "gambar",
    "hdmi",
    "input",
    "lampu",
    "lembap",
    "lembab",
    "menyala",
    "ruang",
    "ruangan",
    "ventilasi",
  ];

  return (
    projectorWords.some((word) => text.includes(word))
    && issueWords.some((word) => text.includes(word))
  );
};

const buildProjectorAnswer = () => [
  "**Proyektor Berkedip / Gambar Tidak Stabil**",
  "",
  "Untuk kondisi ruangan lembap, langkah pertama harus fokus ke keselamatan perangkat dan koneksi display.",
  "",
  "**Langkah aman pertama:**",
  "1. Jangan membongkar proyektor atau membuka casing.",
  "2. Matikan proyektor dengan prosedur normal, lalu tunggu kipas berhenti sebelum mencabut daya.",
  "3. Pastikan area proyektor kering, tidak ada embun/cairan, dan ventilasi tidak tertutup.",
  "4. Cek kabel HDMI/VGA dan input source; cabut-pasang ulang kabel hanya saat perangkat sudah aman.",
  "5. Nyalakan kembali setelah beberapa menit, lalu uji dengan satu sumber input yang stabil.",
  "",
  "**Jika gambar masih berkedip:**",
  "- Coba kabel atau port input lain.",
  "- Catat pola lampu indikator proyektor.",
  "- Eskalasikan ke helpdesk/teknisi jika ada panas berlebih, bau terbakar, atau indikator error.",
  "",
  "**Data yang perlu dikirim:**",
  "- Ruang meeting/lokasi perangkat.",
  "- Model proyektor, serial number, atau asset tag.",
  "- Jenis input yang dipakai dan foto kondisi kabel/indikator.",
].join("\n");

const isRobotIssue = (message = "") => {
  const text = message.toLowerCase();
  const robotWords = ["robot", "robotika", "scara", "6-axis", "6 axis", "six-axis", "six axis"];
  return robotWords.some((word) => text.includes(word));
};

const buildRobotAnswer = () => [
  "**Robotika Epson / SCARA / 6-Axis Bermasalah**",
  "",
  "Untuk perangkat robotika, langkah pertama harus mengutamakan keselamatan area kerja.",
  "",
  "**Langkah aman pertama:**",
  "1. Hentikan mode auto/produksi sesuai SOP area sebelum pengecekan.",
  "2. Jangan masuk ke area kerja robot jika safety gate, light curtain, atau interlock belum aman.",
  "3. Cek status emergency stop, safety gate, controller, teach pendant, dan alarm yang tampil.",
  "4. Pastikan tidak ada benda asing, kabel tertarik, gripper tersangkut, atau tekanan udara/payload tidak sesuai.",
  "5. Jika ada alarm servo/axis/controller, catat kode alarm sebelum reset.",
  "",
  "**Data yang perlu dikirim:**",
  "- Area produksi/lokasi cell robot.",
  "- Model robot/controller, asset tag, dan axis/gripper yang bermasalah.",
  "- Kode alarm, foto teach pendant/controller, dan langkah terakhir sebelum error.",
].join("\n");

const isSmartGlassesIssue = (message = "") => {
  const text = message.toLowerCase();
  const smartGlassWords = ["moverio", "smartglass", "smart glasses", "smart glass", "kacamata pintar"];
  return smartGlassWords.some((word) => text.includes(word));
};

const buildSmartGlassesAnswer = () => [
  "**Moverio / Smart Glasses Bermasalah**",
  "",
  "Mulai dari pengecekan aman pada display, controller, kabel, dan sumber input.",
  "",
  "**Langkah pengecekan:**",
  "1. Jika perangkat lembap/terkena cairan, hentikan penggunaan dan jangan dicas dulu.",
  "2. Pastikan kabel USB-C/Type-C atau koneksi controller terpasang rapat dan tidak longgar.",
  "3. Restart controller/perangkat sumber, lalu uji kembali dengan aplikasi atau sumber input yang sama.",
  "4. Cek apakah display gelap total, berkedip, blur, hanya satu sisi, atau touchpad/controller tidak merespons.",
  "5. Jika memakai aplikasi internal, pastikan aplikasi tidak freeze dan izin display/koneksi sudah aktif.",
  "",
  "**Data yang perlu dikirim:**",
  "- Model Moverio/smart glasses dan controller yang dipakai.",
  "- Kondisi baterai/charger/kabel, gejala display, dan aplikasi yang digunakan.",
  "- Foto perangkat atau error screen jika ada.",
].join("\n");

const isPosIssue = (message = "") => {
  const text = message.toLowerCase();
  const posWords = ["point of sale", "pos", "printer struk", "receipt", "struk", "kasir", "tm-t", "thermal"];
  return posWords.some((word) => text.includes(word));
};

const buildPosAnswer = () => [
  "**POS / Receipt Printer Epson Bermasalah**",
  "",
  "Untuk printer struk atau perangkat kasir, mulai dari jalur kertas, cutter, power, dan koneksi host.",
  "",
  "**Langkah pengecekan:**",
  "1. Pastikan roll thermal terpasang dengan arah yang benar dan cover tertutup rapat.",
  "2. Jika kertas macet, matikan perangkat dan keluarkan kertas perlahan; jangan paksa cutter.",
  "3. Cek lampu indikator, status paper out/cover open, dan apakah cutter berhenti di posisi tidak normal.",
  "4. Periksa kabel USB/LAN/serial dan status queue atau aplikasi POS di komputer kasir.",
  "5. Jalankan test print/self-test jika aman dan sesuai SOP area.",
  "",
  "**Data yang perlu dikirim:**",
  "- Lokasi kasir/area, model printer, serial number atau asset tag.",
  "- Status lampu/error, jenis koneksi, dan aplikasi POS yang dipakai.",
  "- Foto jalur kertas/cutter jika ada macet.",
].join("\n");

const isLabelPrinterIssue = (message = "") => {
  const text = message.toLowerCase();
  const labelWords = ["label", "barcode", "gap sensor", "black mark", "media guide"];
  return labelWords.some((word) => text.includes(word));
};

const buildLabelPrinterAnswer = () => [
  "**Label Printer Epson Bermasalah**",
  "",
  "Untuk label miring, tidak feed, atau barcode tidak terbaca, fokus ke media, sensor, dan kalibrasi.",
  "",
  "**Langkah pengecekan:**",
  "1. Pastikan roll label terpasang lurus dan media guide tidak terlalu longgar/terlalu menekan.",
  "2. Cek jenis media: gap label, continuous, atau black mark harus sesuai setting printer/aplikasi.",
  "3. Bersihkan area sensor label dan roller dari debu, lem, atau potongan label.",
  "4. Jalankan feed/calibration sesuai SOP agar sensor membaca gap atau black mark ulang.",
  "5. Uji cetak satu label dan cek apakah posisi, barcode, serta kualitas cetak sudah stabil.",
  "",
  "**Data yang perlu dikirim:**",
  "- Model printer label, ukuran label, dan jenis media.",
  "- Gejala: skip label, miring, blank, barcode gagal scan, atau sensor error.",
  "- Foto roll label, jalur media, dan hasil cetak.",
].join("\n");

const isLargeFormatIssue = (message = "") => {
  const text = message.toLowerCase();
  const largeFormatWords = ["surecolor", "large format", "wide format", "plotter"];
  return largeFormatWords.some((word) => text.includes(word));
};

const buildLargeFormatAnswer = () => [
  "**SureColor / Large Format Bermasalah**",
  "",
  "Untuk masalah output besar seperti warna meleset, banding, atau media tidak stabil, mulai dari media dan print quality dasar.",
  "",
  "**Langkah pengecekan:**",
  "1. Pastikan jenis media, roll paper, dan media profile sesuai dengan pekerjaan cetak.",
  "2. Jalankan nozzle check dan simpan hasilnya sebelum melakukan cleaning.",
  "3. Cek level tinta, maintenance tank, platen, dan jalur media dari debu atau sisa potongan media.",
  "4. Lakukan alignment/calibration jika output bergaris, miring, atau warna tidak konsisten.",
  "5. Hindari cleaning berulang tanpa mengecek sample output dan status tinta/maintenance tank.",
  "",
  "**Data yang perlu dikirim:**",
  "- Model SureColor/large format, lokasi, dan asset tag.",
  "- Jenis media/profile, sample output, dan hasil nozzle check.",
  "- Kode error atau status panel jika ada.",
].join("\n");

const isLedDisplayIssue = (message = "") => {
  const text = message.toLowerCase();
  const ledWords = ["direct view", "dv led", "led display", "panel led", "signage"];
  return ledWords.some((word) => text.includes(word));
};

const buildLedDisplayAnswer = () => [
  "**Direct View LED / Display Epson Bermasalah**",
  "",
  "Untuk display berkedip atau panel tidak stabil, mulai dari power, controller, input source, dan indikator modul.",
  "",
  "**Langkah aman pertama:**",
  "1. Jangan membuka panel/module display jika tidak berwenang.",
  "2. Pastikan area display kering, ventilasi tidak tertutup, dan tidak ada bau terbakar/panas berlebih.",
  "3. Cek power distribution, controller, kabel data, dan input source yang digunakan.",
  "4. Amati apakah masalah terjadi di semua panel atau hanya satu module/area tertentu.",
  "5. Catat pola indikator/error controller sebelum restart sesuai SOP.",
  "",
  "**Data yang perlu dikirim:**",
  "- Lokasi display, model/controller, dan area panel yang bermasalah.",
  "- Foto/video flicker, indikator controller, dan sumber input.",
  "- Waktu kejadian dan perubahan terakhir sebelum error.",
].join("\n");

const isMicrodeviceIssue = (message = "") => {
  const text = message.toLowerCase();
  const microdeviceWords = ["microdevice", "micro device", "modul sensor", "sensor module", "oscillator", "crystal"];
  return microdeviceWords.some((word) => text.includes(word));
};

const buildMicrodeviceAnswer = () => [
  "**Microdevice / Modul Epson Bermasalah**",
  "",
  "Untuk modul, board, sensor, atau microdevice, pengecekan harus mengikuti SOP engineering karena risikonya lebih teknis.",
  "",
  "**Langkah pengecekan awal:**",
  "1. Jangan hot-swap modul/board kecuali SOP area memang mengizinkan.",
  "2. Pastikan power supply, konektor, ribbon/cable, dan seating modul terpasang benar.",
  "3. Cek log alat uji, status driver, atau pesan error dari sistem host.",
  "4. Bandingkan dengan unit referensi jika tersedia dan aman dilakukan.",
  "5. Jika ada indikasi short, panas berlebih, atau bau terbakar, hentikan penggunaan dan eskalasikan.",
  "",
  "**Data yang perlu dikirim:**",
  "- Area/lini, tipe modul/board, serial atau lot jika tersedia.",
  "- Gejala, log/error host, dan perubahan terakhir sebelum masalah.",
  "- Foto konektor/label modul tanpa membongkar area yang tidak diizinkan.",
].join("\n");

const isScannerAdfIssue = (message = "") => {
  const text = message.toLowerCase();
  const scannerWords = ["adf", "memindai", "pemindai", "scan", "scanner"];
  const issueWords = ["calibration", "error", "feed", "jam", "macet", "miring", "nyangkut", "tersangkut"];

  return (
    scannerWords.some((word) => text.includes(word))
    && issueWords.some((word) => text.includes(word))
  );
};

const isScannerPanelIssue = (message = "") => {
  const text = message.toLowerCase();
  const scannerWords = ["scan", "scanner", "pemindai"];
  const panelWords = ["panel", "tombol", "button", "keypad", "layar", "touch"];
  const issueWords = [
    "lembap",
    "lembab",
    "tidak responsif",
    "tidak respon",
    "tdk responsif",
    "hang",
    "macet",
    "tidak bisa ditekan",
    "tidak merespon",
  ];

  return (
    scannerWords.some((word) => text.includes(word))
    && panelWords.some((word) => text.includes(word))
    && issueWords.some((word) => text.includes(word))
  );
};

const buildScannerPanelAnswer = () => [
  "**Panel Scanner Tidak Responsif**",
  "",
  "Kemungkinan awalnya terkait kondisi panel/tombol, kelembapan, atau perangkat yang hang. Lakukan langkah aman berikut dulu.",
  "",
  "**Langkah aman pertama:**",
  "1. Jangan menekan tombol berulang-ulang agar panel tidak makin bermasalah.",
  "2. Hentikan job scan yang sedang berjalan dari komputer atau aplikasi terkait.",
  "3. Matikan scanner/perangkat dari tombol power jika masih bisa.",
  "4. Cabut kabel daya selama 1-2 menit, lalu pastikan area sekitar perangkat kering dan tidak ada embun/cairan.",
  "5. Nyalakan kembali dan coba tekan satu tombol dasar, misalnya power/menu, tanpa menjalankan job scan dulu.",
  "",
  "**Jika masih tidak responsif:**",
  "- Jangan bongkar panel sendiri.",
  "- Pindahkan perangkat dari area lembap bila memungkinkan.",
  "- Eskalasikan ke helpdesk/teknisi dengan foto panel dan kondisi area.",
  "",
  "**Data yang perlu dikirim:**",
  "- Departemen/area dan lokasi perangkat.",
  "- Model scanner/perangkat serta serial number atau asset tag.",
  "- Apakah layar menyala, ada lampu indikator, atau muncul kode error.",
].join("\n");

const buildScannerAdfAnswer = () => [
  "**Scanner / ADF Macet**",
  "",
  "Baik, saya bantu cek masalah scanner/ADF Epson Anda.",
  "",
  "**Langkah pengecekan:**",
  "1. Hentikan pekerjaan scan terlebih dahulu agar dokumen tidak makin tersangkut.",
  "2. Matikan perangkat, lalu keluarkan kertas mengikuti arah feed secara perlahan.",
  "3. Periksa separation pad, pickup roller, dan jalur kertas ADF dari debu, sobekan kertas, atau benda asing.",
  "4. Bersihkan paper path ADF dengan hati-hati, lalu coba jalankan calibration scan atau test scan satu lembar.",
  "5. Jika sensor ADF masih aktif padahal jalur kosong, catat kode/status sensor dan lampirkan foto area feed saat eskalasi.",
  "",
  "**Data yang perlu dikirim:**",
  "- Model scanner/perangkat Epson dan lokasi perangkat.",
  "- Posisi dokumen tersangkut: input ADF, tengah jalur, atau output.",
  "- Kode error, status sensor, atau pola lampu indikator.",
].join("\n");

const isPaperJam = (message = "") => {
  if (isScannerAdfIssue(message)) return false;

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
  const text = String(topContext?.chunkText || "").toLowerCase();
  const userTopic = IntentService.classifyIssueTopic(message);

  if (
    userTopic === "scanner" &&
    (
      text.includes("adf") ||
      text.includes("scanner") ||
      text.includes("scan")
    )
  ) {
    return buildScannerAdfAnswer();
  }

  if (
    (!userTopic || userTopic === "printQuality") &&
    (
      text.includes("banding") ||
      text.includes("nozzle") ||
      text.includes("missing dots")
    )
  ) {
    return [
      "**Print Quality Bergaris / Banding**",
      "",
      "Untuk kasus print quality seperti ini, mulai dari pengecekan dasar terlebih dahulu.",
      "",
      "**Langkah pengecekan:**",
      "1. Jalankan nozzle check dan simpan hasilnya.",
      "2. Cek status ink supply serta pastikan tidak ada indikasi ink path bermasalah.",
      "3. Periksa kebersihan platen dan kondisi media.",
      "4. Cek alignment media/head sebelum melakukan head cleaning.",
      "5. Hindari head cleaning berulang sebelum maintenance tank dan jalur tinta dipastikan normal.",
      "",
      "**Jika masih bermasalah:**",
      "- Siapkan sample output.",
      "- Catat serial number atau asset tag printer.",
      "- Lampirkan lot tinta dan kondisi lingkungan area produksi.",
    ].join("\n");
  }

  if (
    (!userTopic || userTopic === "scanner") &&
    (
      text.includes("adf") ||
      text.includes("scanner") ||
      text.includes("jam")
    )
  ) {
    return [
      "**Scanner / ADF Macet**",
      "",
      "**Langkah pengecekan:**",
      "1. Hentikan job scan terlebih dahulu.",
      "2. Keluarkan dokumen mengikuti arah feed secara perlahan.",
      "3. Cek separation pad, pickup roller, dan debu di paper path.",
      "4. Jalankan calibration scan setelah jalur kertas bersih.",
      "5. Jika sensor ADF masih aktif, catat status sensor dan lampirkan foto area feed saat eskalasi.",
    ].join("\n");
  }

  if (
    (!userTopic || userTopic === "network") &&
    (
      text.includes("network") ||
      text.includes("ip address") ||
      text.includes("subnet")
    )
  ) {
    return [
      "**Printer Tidak Terdeteksi di Jaringan**",
      "",
      "**Langkah pengecekan:**",
      "1. Pastikan kabel jaringan/Wi-Fi aktif dan link light menyala.",
      "2. Cek IP address perangkat dan pastikan tidak ada konflik IP.",
      "3. Verifikasi subnet, gateway, dan DNS.",
      "4. Cek status queue pada print server.",
      "5. Jika masih gagal, restart network service hanya pada window produksi yang disetujui.",
      "",
      "**Data untuk eskalasi:**",
      "- Hasil ping.",
      "- Network report device.",
      "- Lokasi perangkat dan asset tag.",
    ].join("\n");
  }

  return [
    "**Pengecekan Awal**",
    "",
    "Mulai dari kondisi mesin dan gejala yang paling jelas.",
    "",
    "**Langkah pengecekan:**",
    "1. Catat kode error atau indikator yang muncul.",
    "2. Periksa perubahan terakhir sebelum masalah terjadi.",
    "3. Ambil bukti visual jika ada, seperti foto perangkat atau sample output.",
    "4. Coba recovery standar yang aman sesuai gejala.",
    "",
    "**Jika belum selesai:**",
    "- Siapkan lokasi perangkat, model, serial number atau asset tag.",
    "- Eskalasikan ke helpdesk dengan bukti dan langkah yang sudah dicoba.",
  ].join("\n");
};

// Troubleshooting umum yang aman saat tidak ada artikel knowledge base spesifik.
const buildSafeFallbackAnswer = (message = "") => {
  const cleanMessage = String(message).trim();

  if (isRobotIssue(cleanMessage)) return buildRobotAnswer();
  if (isSmartGlassesIssue(cleanMessage)) return buildSmartGlassesAnswer();
  if (isPosIssue(cleanMessage)) return buildPosAnswer();
  if (isLabelPrinterIssue(cleanMessage)) return buildLabelPrinterAnswer();
  if (isLargeFormatIssue(cleanMessage)) return buildLargeFormatAnswer();
  if (isLedDisplayIssue(cleanMessage)) return buildLedDisplayAnswer();
  if (isMicrodeviceIssue(cleanMessage)) return buildMicrodeviceAnswer();
  if (isProjectorIssue(cleanMessage)) return buildProjectorAnswer();
  if (isScannerPanelIssue(cleanMessage)) return buildScannerPanelAnswer();
  if (isScannerAdfIssue(cleanMessage)) return buildScannerAdfAnswer();
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

  const ruleIntent = IntentService.classifyIntent(message || "");
  const intent = ruleIntent === "helpdesk" ? "helpdesk" : (providedIntent || ruleIntent);

  if (intent === "greeting") {
    return buildGreetingAnswer();
  }

  if (intent === "other") {
    return buildOutOfScopeAnswer();
  }

  if (imagePath && (isImageIdentityQuestion(message) || !contexts.length)) {
    return buildImageFallbackAnswer(message);
  }

  if (isRobotIssue(message)) {
    return buildRobotAnswer();
  }

  if (isSmartGlassesIssue(message)) {
    return buildSmartGlassesAnswer();
  }

  if (isPosIssue(message)) {
    return buildPosAnswer();
  }

  if (isLabelPrinterIssue(message)) {
    return buildLabelPrinterAnswer();
  }

  if (isLargeFormatIssue(message)) {
    return buildLargeFormatAnswer();
  }

  if (isLedDisplayIssue(message)) {
    return buildLedDisplayAnswer();
  }

  if (isMicrodeviceIssue(message)) {
    return buildMicrodeviceAnswer();
  }

  if (isProjectorIssue(message)) {
    return buildProjectorAnswer();
  }

  if (isScannerPanelIssue(message)) {
    return buildScannerPanelAnswer();
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
            maxOutputTokens: runtimeConfig.maxOutputTokens,
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

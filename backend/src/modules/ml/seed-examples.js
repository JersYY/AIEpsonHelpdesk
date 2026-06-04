// Built-in labeled examples so the ML models have signal even before any
// real conversations accumulate. Real data from the DB is merged on top.

export const CATEGORY_EXAMPLES = [
  // Print Quality Issue
  { text: "hasil cetak ada garis banding di output", label: "Print Quality Issue" },
  { text: "nozzle check missing dots di channel cyan", label: "Print Quality Issue" },
  { text: "tinta belang dan warna pudar saat print", label: "Print Quality Issue" },
  { text: "head cleaning sudah tapi cetakan masih bergaris", label: "Print Quality Issue" },
  { text: "alignment media tidak rapi hasil buram", label: "Print Quality Issue" },
  { text: "print quality jelek ada smear di kertas", label: "Print Quality Issue" },
  // Scanner Error
  { text: "scanner adf jam kertas nyangkut saat scan", label: "Scanner Error" },
  { text: "hasil scan ada garis artifact dan miring", label: "Scanner Error" },
  { text: "kalibrasi scanner gagal sensor adf error", label: "Scanner Error" },
  { text: "scan tidak jalan pickup roller bermasalah", label: "Scanner Error" },
  { text: "scanner tidak bisa feed dokumen", label: "Scanner Error" },
  // Network Issue
  { text: "printer tidak terdeteksi di jaringan wifi", label: "Network Issue" },
  { text: "ip address printer konflik tidak bisa connect", label: "Network Issue" },
  { text: "print server queue error koneksi ethernet putus", label: "Network Issue" },
  { text: "printer tidak muncul saat discovery network", label: "Network Issue" },
  { text: "gateway dns salah printer offline di jaringan", label: "Network Issue" },
  // Hardware Problem
  { text: "printer mati total tidak menyala sama sekali", label: "Hardware Problem" },
  { text: "lampu indikator berkedip terus motor bunyi", label: "Hardware Problem" },
  { text: "cover printer tidak bisa nutup sensor rusak", label: "Hardware Problem" },
  { text: "printer tidak nyala kabel daya sudah dicek", label: "Hardware Problem" },
  { text: "ada bau terbakar dari printer dan panas berlebih", label: "Hardware Problem" },
  // Firmware Problem
  { text: "setelah update firmware printer error behavior aneh", label: "Firmware Problem" },
  { text: "versi firmware mismatch perangkat hang", label: "Firmware Problem" },
  { text: "firmware gagal update printer stuck", label: "Firmware Problem" },
  { text: "update firmware bikin printer tidak responsif", label: "Firmware Problem" },
  // Part Problem
  { text: "roller tray kertas aus perlu ganti part", label: "Part Problem" },
  { text: "kabel printer rusak butuh spare part", label: "Part Problem" },
  { text: "consumable habis perlu replacement part", label: "Part Problem" },
  { text: "tray macet komponen mekanik perlu diganti", label: "Part Problem" },
];

export const INTENT_EXAMPLES = [
  // greeting
  { text: "hai", label: "greeting" },
  { text: "halo", label: "greeting" },
  { text: "halo selamat pagi", label: "greeting" },
  { text: "hi assistant", label: "greeting" },
  { text: "selamat siang", label: "greeting" },
  { text: "permisi mau tanya", label: "greeting" },
  { text: "hello there", label: "greeting" },
  { text: "assalamualaikum", label: "greeting" },
  // helpdesk
  { text: "printer saya mati tidak menyala", label: "helpdesk" },
  { text: "printer tidak bisa print", label: "helpdesk" },
  { text: "kertas macet di printer", label: "helpdesk" },
  { text: "lampu printer berkedip terus", label: "helpdesk" },
  { text: "hasil cetak bergaris", label: "helpdesk" },
  { text: "scanner error tidak jalan", label: "helpdesk" },
  { text: "printer tidak terdeteksi di jaringan", label: "helpdesk" },
  { text: "bagaimana cara memperbaiki printer epson", label: "helpdesk" },
  { text: "tinta tidak keluar saat mencetak", label: "helpdesk" },
  { text: "firmware error setelah update", label: "helpdesk" },
  // other
  { text: "berapa harga saham hari ini", label: "other" },
  { text: "cuaca besok bagaimana", label: "other" },
  { text: "siapa presiden indonesia", label: "other" },
  { text: "resep nasi goreng enak", label: "other" },
  { text: "terjemahkan kalimat ini ke bahasa inggris", label: "other" },
  { text: "ceritakan lelucon lucu", label: "other" },
];

export const PRIORITY_EXAMPLES = [
  // HIGH: production stop, safety, total failure
  { text: "printer mati total produksi berhenti bau terbakar", label: "HIGH" },
  { text: "mesin tidak bisa dipakai sama sekali urgent", label: "HIGH" },
  { text: "ada percikan api dan asap dari perangkat", label: "HIGH" },
  { text: "seluruh lini produksi terhenti printer rusak parah", label: "HIGH" },
  { text: "error fatal perangkat tidak merespon sama sekali", label: "HIGH" },
  // MEDIUM: degraded but usable
  { text: "hasil cetak bergaris tapi masih bisa dipakai", label: "MEDIUM" },
  { text: "scanner kadang error perlu diulang", label: "MEDIUM" },
  { text: "printer lambat kadang gagal connect jaringan", label: "MEDIUM" },
  { text: "kualitas print menurun perlu cleaning", label: "MEDIUM" },
  { text: "kertas sesekali macet masih bisa lanjut", label: "MEDIUM" },
  // LOW: minor, cosmetic, questions
  { text: "tanya cara ganti tinta yang benar", label: "LOW" },
  { text: "minta panduan maintenance rutin", label: "LOW" },
  { text: "pertanyaan umum tentang setting printer", label: "LOW" },
  { text: "ingin tahu jadwal pembersihan berkala", label: "LOW" },
  { text: "konsultasi ringan soal pemakaian normal", label: "LOW" },
];

export default { CATEGORY_EXAMPLES, INTENT_EXAMPLES, PRIORITY_EXAMPLES };

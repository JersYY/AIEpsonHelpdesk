# Demo Presentasi Epson AI Helpdesk

Tujuan demo: membuktikan aplikasi bukan hanya chatbot, tetapi helpdesk end-to-end: register/approval, chat AI + RAG, ML classification, ticket escalation, helpdesk handling, email log, analytics, dan self-learning review.

## 0. Persiapan Cepat

Jalankan service:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

URL demo:

| Layanan | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:4000` |
| Swagger | `http://localhost:4000/api/docs` |
| Mailpit | `http://localhost:8025` |

Akun seed:

| Role | Employee ID | Password |
|---|---|---|
| ADMIN | `ADM001` | `Password123!` |
| HELPDESK | `HD001` | `Password123!` |

Operator dibuat saat demo. Jika employee ID sudah pernah dipakai, ganti suffix, contoh `EMP-DEMO-02`.

## 1. Landing, Register, dan Approval Akun

**Aksi demo**

1. Buka `http://localhost:5173`.
2. Tunjukkan landing page.
3. Klik Register.
4. Isi:

| Field | Isi |
|---|---|
| Employee ID | `EMP-DEMO-01` |
| Name | `Demo Operator` |
| Email | `demo.operator@epson.local` |
| Department | `Assembly` |
| Password | `Password123!` |

**Buktikan**

- Setelah register, user masuk status `PENDING`.
- User diarahkan ke halaman pending approval.
- Ini membuktikan register operator tidak langsung bisa memakai fitur internal.

**Aksi approval**

1. Logout atau buka browser/incognito lain.
2. Login admin: `ADM001` / `Password123!`.
3. Buka Admin -> Accounts.
4. Cari `EMP-DEMO-01`.
5. Approve akun.

**Buktikan**

- Status berubah dari `PENDING` ke `ACTIVE`.
- Ini membuktikan kontrol akses berbasis approval.

## 2. Login Operator dan Dashboard

**Aksi demo**

1. Login sebagai operator: `EMP-DEMO-01` / `Password123!`.
2. Buka Dashboard.

**Buktikan**

- Dashboard tampil setelah akun aktif.
- Ada quick actions, popular issues, dan recent activity.
- Popular issues berasal dari chat/ticket 30 hari terakhir.

## 3. Demo Chat RAG: Knowledge Base Grounded

Masuk ke Chat, lalu kirim prompt ini:

```txt
Hasil cetak Epson bergaris atau banding setelah maintenance. Nozzle check menunjukkan missing dots di channel cyan. Apa yang harus dicek dulu?
```

**Yang harus dijelaskan**

- Prompt sengaja memakai kata `banding`, `nozzle check`, dan `missing dots` karena cocok dengan seed knowledge `Print Quality Banding Troubleshooting`.
- Backend menjalankan ML prediction, RAG retrieval, prompt grounding, lalu AI generation.

**Buktikan di UI**

- AI menjawab langkah troubleshooting print quality.
- Jawaban menyebut pengecekan seperti nozzle check, tinta, platen, media/alignment, dan head cleaning yang tidak berulang sembarangan.
- Related context menampilkan knowledge berjudul `Print Quality Banding Troubleshooting` atau source `Internal SOP PQ-001`.
- Jika ada label provider/mode, tunjukkan provider AI dan mode respons.
- Jika AI key kosong, provider bisa `mock`; tetap buktikan flow RAG, context, dan jawaban aman berjalan.

## 4. Demo ML: Kategori, Priority, dan Eskalasi

Kirim prompt lanjutan di chat yang sama:

```txt
Masalah ini mengganggu produksi karena output bergaris masih muncul walaupun cleaning sudah dilakukan.
```

**Buktikan**

- Chat tetap tersimpan dalam session yang sama.
- Kategori cenderung masuk `Print Quality Issue`.
- Confidence/grounding membantu UI memberi sinyal apakah jawaban cukup kuat.
- Jika jawaban kurang yakin atau masalah belum selesai, UI menyediakan eskalasi ke helpdesk.

**Bukti tambahan dari admin**

- Login admin -> Analytics.
- Tunjukkan total queries bertambah.
- Tunjukkan top/popular issues mulai merekam kategori issue dari chat/ticket.

## 5. Demo Safety: Pertanyaan di Luar Domain

Di chat baru, kirim:

```txt
Buatkan resep nasi goreng dan rekomendasi film.
```

**Buktikan**

- AI tidak menjawab panjang di luar domain.
- AI mengarahkan kembali ke troubleshooting perangkat Epson.
- Related context kosong atau tidak menjadi acuan.
- Ini membuktikan intent filtering dan prompt safety.

## 6. Demo Temporary Chat

Masuk ke `/chat/temp`, lalu kirim:

```txt
Printer tidak terdeteksi di jaringan, IP sudah benar tetapi queue di print server offline.
```

**Buktikan**

- Ada banner temporary mode.
- Chat tetap mendapat jawaban.
- Percakapan tidak masuk history.
- Tidak bisa dipakai untuk ticket dan self-learning.
- Ini membuktikan privacy/data control.

## 7. Demo Upload Gambar

Kembali ke chat normal. Upload gambar `.jpg`, `.png`, atau `.webp`, lalu kirim prompt:

```txt
Saya lampirkan foto hasil cetak yang bergaris. Tolong analisa defect dan berikan langkah awal yang aman.
```

**Buktikan**

- Gambar muncul di bubble chat.
- Backend menyimpan metadata gambar.
- Jika Gemini Vision aktif, provider gambar memakai vision.
- Jika vision/API key tidak aktif, AI tetap memberi fallback aman dan meminta detail tambahan.
- Gambar ikut terbawa ke ticket/email sebagai attachment metadata.

## 8. Eskalasi Chat Menjadi Ticket

Klik tombol Eskalasi ke Helpdesk.

Pilih priority:

```txt
HIGH
```

**Buktikan**

- Ticket dibuat dengan kode seperti `TKT-001`.
- Status awal `OPEN`.
- Priority `HIGH`.
- Summary ticket dibuat dari percakapan.
- Chat session berubah menjadi `ESCALATED`.
- Ini membuktikan chat bisa berubah menjadi kasus helpdesk formal.

## 9. Helpdesk Menangani Ticket

Login sebagai helpdesk:

```txt
HD001 / Password123!
```

Buka Helpdesk -> Tickets -> detail ticket terbaru.

**Buktikan**

- Ticket queue menampilkan ticket operator.
- Detail ticket menampilkan:
  - ticket code
  - requester/operator
  - priority dan status
  - summary multi-section
  - history chat read-only
  - attachment jika ada
  - thread komentar

Kirim balasan helpdesk:

```txt
Lakukan nozzle check ulang, simpan hasilnya, cek alignment media, dan hindari head cleaning berulang sebelum maintenance tank dipastikan normal. Balas ticket ini dengan hasil pengecekan.
```

**Buktikan**

- Komentar helpdesk masuk ke thread.
- Status otomatis menjadi `IN_PROGRESS` jika sebelumnya `OPEN`.
- Operator nanti bisa melihat balasan ini dari halaman Tickets.

## 10. Email Summary dan Email Logs

Dari detail ticket helpdesk, kirim email report:

| Field | Isi |
|---|---|
| Recipient | `lead@epson.local` |
| Subject | `Epson Helpdesk - Ringkasan Eskalasi Demo` |

**Buktikan**

- Jika Mailpit aktif, email muncul di `http://localhost:8025`.
- Email berisi summary ticket.
- Jika ada gambar, attachment ikut tercatat.
- Di UI Email Logs, status tercatat `SENT`.
- Jika Mailpit tidak aktif, status bisa `FAILED`, tetapi log tetap dibuat. Ini tetap membuktikan audit log email.

## 11. Operator Konfirmasi Resolusi

Login kembali sebagai operator, buka Tickets, lalu buka ticket demo.

Kirim konfirmasi:

```txt
Solusi berhasil setelah alignment ulang dan nozzle check sudah normal. Hasil cetak tidak bergaris lagi.
```

Pilih resolved/solusi berhasil.

**Buktikan**

- Komentar operator masuk ke thread.
- Ticket berubah menjadi `CLOSED` atau resolved sesuai flow UI.
- Session chat terkait menjadi `RESOLVED`.
- Ini membuktikan loop helpdesk selesai dari sisi operator.

## 12. Self-Learning Candidate

Login admin, buka Admin -> Learning Candidates.

**Buktikan**

- Ada candidate baru dari feedback/ticket resolved.
- Status awal `PENDING`.
- Konten candidate berasal dari percakapan tervalidasi.
- Data sensitif sederhana direduksi/redacted jika ada email, phone, token, password, secret, atau API key.

Approve candidate.

**Buktikan**

- Candidate berubah menjadi `APPROVED`.
- Knowledge document baru dibuat.
- Dokumen masuk Admin -> Knowledge.
- Ini membuktikan self-learning tidak otomatis masuk RAG sebelum direview manusia.

## 13. Bukti RAG dari Knowledge Baru

Untuk bukti yang sangat jelas, admin bisa buat knowledge manual dengan frasa unik.

Admin -> Knowledge -> Create:

| Field | Isi |
|---|---|
| Title | `Demo Wrinkle Label Check` |
| Source | `Demo SOP` |
| Content | `Jika user menyebut DEMO-WRINKLE-77, cek tension label, roller feed, kelembapan media, dan arah gulungan sebelum eskalasi.` |
| Category | `Print Quality Issue` |

Lalu operator buat chat baru dengan prompt:

```txt
Apa prosedur untuk kasus DEMO-WRINKLE-77?
```

**Buktikan**

- Related context menampilkan `Demo Wrinkle Label Check`.
- AI menjawab sesuai isi knowledge baru: tension label, roller feed, kelembapan media, arah gulungan.
- Ini bukti paling kuat bahwa RAG memakai knowledge base yang bisa diupdate admin.

## 14. Admin Analytics dan Chat Logs

Login admin, buka:

- Admin -> Analytics.
- Admin -> Chat Logs.
- Admin -> Knowledge.
- Admin -> Accounts.

**Buktikan**

- `totalQueries` naik setelah demo chat.
- `totalEscalations` naik setelah ticket dibuat.
- `avgResponseTime` terisi dari AI response.
- Chat logs menyimpan session, messages, provider/mode, confidence, dan category.
- Accounts membuktikan approval workflow.
- Knowledge membuktikan dokumen RAG bisa dikelola admin.

## 15. Checklist Bukti Akhir

Gunakan checklist ini saat presentasi:

| Fitur | Bukti yang Harus Terlihat |
|---|---|
| Auth dan approval | Operator register `PENDING`, admin approve jadi `ACTIVE` |
| Role guard | User tidak bisa masuk halaman admin/helpdesk |
| Chat AI | User mendapat jawaban troubleshooting |
| RAG | Related context menampilkan knowledge yang relevan |
| ML category | Issue masuk kategori seperti `Print Quality Issue` |
| Safety | Prompt luar domain diarahkan balik ke Epson |
| Temporary chat | Tidak tersimpan di history dan tidak bisa eskalasi |
| Upload gambar | Gambar muncul di chat dan terbawa ke ticket/report |
| Ticket escalation | Ticket `TKT-xxx` dibuat dari chat |
| Helpdesk thread | Helpdesk dan operator bisa saling membalas |
| Email report | Email log `SENT` atau `FAILED` tercatat |
| Analytics | Query, escalation, response time, top issues berubah |
| Self-learning | Candidate `PENDING` lalu `APPROVED` setelah review |
| Knowledge update | Knowledge baru bisa dipakai RAG |

## 16. Kalau Ada Kendala Saat Demo

| Kendala | Cara menjelaskan |
|---|---|
| Provider AI key kosong/quota habis | Sistem fallback ke `mock`, chat tetap aman dan workflow tetap berjalan |
| Mailpit belum jalan | Email log tetap tercatat `FAILED`; jalankan Mailpit untuk bukti inbox |
| Employee ID sudah ada | Gunakan ID baru, misalnya `EMP-DEMO-02` |
| Context RAG tidak muncul | Pastikan prompt memakai kata seed: `banding`, `nozzle check`, `missing dots`, `network`, `ADF jam` |
| Candidate belum muncul | Pastikan ticket sudah resolved/closed atau beri feedback UP pada AI answer |

## 17. Script Penutup

Kalimat penutup singkat:

```txt
Demo ini membuktikan Epson AI Helpdesk sudah mencakup workflow lengkap: operator bertanya ke AI, AI mengambil rujukan dari knowledge base, ML membantu klasifikasi dan prioritas, chat bisa dieskalasi menjadi ticket, helpdesk menangani kasus dengan konteks lengkap, dan kasus yang selesai bisa menjadi kandidat knowledge baru setelah review admin.
```


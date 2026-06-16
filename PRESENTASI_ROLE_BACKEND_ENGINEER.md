---
marp: true
theme: default
paginate: true
---

# Role Backend Engineer

Epson AI Helpdesk

Presentasi ini menjelaskan peran backend engineer/developer dalam membangun API, database, authentication, AI/RAG integration, ML workflow, ticket escalation, report, dan sistem admin.

---

# 1. Posisi Backend Engineer di Sistem

Backend engineer bertanggung jawab membuat server menjadi pusat logika aplikasi.

Dalam project ini backend tidak hanya menerima request dari frontend, tetapi juga:

- Mengatur authentication dan authorization.
- Menyimpan dan membaca data dari database.
- Menghubungkan chat ke AI provider.
- Mengambil context dari knowledge base untuk RAG.
- Menjalankan ML lokal untuk klasifikasi.
- Membuat ticket dari chat.
- Membuat summary report dan email log.
- Menjaga validasi, error handling, dan security flow.

Intinya, backend adalah lapisan yang memastikan fitur frontend benar-benar aman, konsisten, dan terhubung ke data.

---

# 2. Scope Pekerjaan Backend

Scope utama backend developer:

| Area | Tanggung Jawab |
|---|---|
| API Server | Membuat endpoint REST dengan Express |
| Database | Mendesain model Prisma dan relasi data |
| Auth | Register, login, JWT, account approval |
| Role Access | Membatasi akses USER, HELPDESK, ADMIN |
| Chat | Menyimpan session, message, feedback, edit, regenerate |
| AI/RAG | Retrieval knowledge base dan generation answer |
| ML | Training dan prediction category, intent, priority |
| Ticket | Eskalasi chat menjadi ticket dan thread komentar |
| Report | Summary ticket/chat dan email report |
| Admin | Analytics, accounts, chat logs, knowledge management |
| File Upload | Upload gambar defect dan attachment |

---

# 3. Backend Tech Stack

Backend dibangun dengan:

- **Node.js** sebagai runtime.
- **Express 5** untuk REST API.
- **Prisma ORM** untuk database access.
- **PostgreSQL** sebagai database utama.
- **pgvector** untuk semantic embedding opsional.
- **JWT** untuk token authentication.
- **bcrypt** untuk password hashing.
- **Multer** untuk upload gambar.
- **Nodemailer** untuk email report.
- **Swagger UI** untuk dokumentasi API.

Alasan stack ini dipilih:

- Express ringan dan fleksibel untuk API modular.
- Prisma memperjelas schema dan relasi database.
- PostgreSQL cocok untuk relational data dan analytics.
- pgvector memberi ruang untuk semantic RAG jika diperlukan.

---

# 4. Struktur Backend

Struktur backend dibuat modular berdasarkan domain fitur.

```txt
backend/
  src/
    app.js
    server.js
    config/
      env.js
      prisma.js
      ai.js
      openapi.js
    middlewares/
      auth.middleware.js
      role.middleware.js
      account.middleware.js
      error.middleware.js
    modules/
      auth/
      chat/
      ai/
      ml/
      tickets/
      knowledge/
      reports/
      admin/
      dashboard/
      files/
      users/
```

Setiap module biasanya punya:

- `*.routes.js`
- `*.controller.js`
- `*.service.js`

Pattern ini membuat route, request handling, dan business logic tidak tercampur.

---

# 5. Entry Point Backend

File utama:

- `backend/src/server.js`
- `backend/src/app.js`

`server.js` bertugas:

- Menjalankan Express app.
- Membuka port backend.
- Menjalankan training ML saat startup.
- Menutup koneksi Prisma saat shutdown.

`app.js` bertugas:

- Setup middleware global.
- Setup CORS dan security headers.
- Setup Swagger docs.
- Mount semua route.
- Memasang auth middleware.
- Memasang error handler.

Ini menunjukkan separation of concern: server lifecycle dipisah dari konfigurasi aplikasi.

---

# 6. API Layer

Backend menyediakan REST API dengan prefix `/api`.

Contoh route utama:

| Prefix | Fungsi |
|---|---|
| `/api/auth` | Register, login, me, logout |
| `/api/chat` | Chat AI, session, feedback, regenerate |
| `/api/files` | Upload dan akses gambar |
| `/api/tickets` | Eskalasi dan ticket handling |
| `/api/reports` | Summary dan email report |
| `/api/knowledge` | Knowledge read-only |
| `/api/learning` | Learning candidate review |
| `/api/admin` | Analytics, accounts, chat logs, AI settings |
| `/api/admin/knowledge` | CRUD knowledge base |
| `/api/admin/ml` | ML train, status, predict |

Backend engineer harus memastikan setiap endpoint punya:

- Validasi input.
- Auth check.
- Role check jika perlu.
- Response format konsisten.
- Error yang mudah dipahami frontend.

---

# 7. Authentication dan Authorization

Auth flow backend:

1. User register atau login.
2. Password di-hash memakai bcrypt.
3. Backend membuat JWT.
4. Frontend mengirim token lewat header:

```txt
Authorization: Bearer <token>
```

Token dibuat di:

```txt
backend/src/modules/auth/auth.service.js
```

Token dicek di:

```txt
backend/src/middlewares/auth.middleware.js
```

Role dicek di:

```txt
backend/src/middlewares/role.middleware.js
```

Account active check ada di:

```txt
backend/src/middlewares/account.middleware.js
```

---

# 8. Account Approval Flow

Backend engineer membuat flow agar operator baru tidak langsung aktif.

Flow:

1. Operator register.
2. Backend membuat user dengan:

```txt
role = USER
accountStatus = PENDING
```

3. Admin melihat daftar pending account.
4. Admin approve atau reject.
5. Jika approved, status berubah menjadi `ACTIVE`.
6. Baru setelah itu user bisa memakai chat, dashboard, ticket, dan knowledge.

Nilai teknis:

- Role tidak bisa dipilih sendiri oleh user.
- Akun baru tetap terkunci sampai admin review.
- Backend tetap memblokir akun pending walaupun frontend route dimanipulasi.

---

# 9. Database Design

Database memakai Prisma schema.

File utama:

```txt
backend/prisma/schema.prisma
```

Model penting:

- `User`
- `IssueCategory`
- `ChatSession`
- `ChatMessage`
- `UploadedFile`
- `KnowledgeDocument`
- `KnowledgeChunk`
- `EscalationTicket`
- `TicketComment`
- `EmailLog`
- `MlModel`
- `TrainingExample`
- `KnowledgeCandidate`
- `AppSetting`

Backend engineer mendesain relasi agar data chat, ticket, user, category, knowledge, dan ML saling terhubung.

---

# 10. Relasi Data Backend

Relasi penting:

- User memiliki banyak chat session.
- Chat session memiliki banyak message.
- Chat session bisa menjadi escalation ticket.
- Ticket tetap terhubung ke session asal.
- Ticket punya comment thread.
- Knowledge document dipecah menjadi knowledge chunks.
- Chat message menyimpan provider AI, confidence, feedback, dan predicted category.
- ML model disimpan sebagai JSON di database.
- Learning candidate dibuat dari session yang tervalidasi.

Relasi ini membuat backend bisa menjawab pertanyaan seperti:

- Ticket ini berasal dari chat apa?
- User mana yang membuat ticket?
- AI menjawab dengan provider apa?
- Knowledge mana yang dipakai RAG?
- Kasus resolved mana yang bisa jadi kandidat knowledge baru?

---

# 11. Chat Backend Flow

Saat user mengirim chat:

1. Backend validasi message atau image.
2. Backend cek session lama atau buat session baru.
3. User message disimpan.
4. ML memprediksi category dan intent.
5. RAG mencari knowledge chunks yang relevan.
6. Prompt dibuat dengan context knowledge.
7. AI provider dipilih otomatis.
8. AI answer disimpan.
9. Backend menghitung confidence.
10. Response dikirim ke frontend.

File utama:

```txt
backend/src/modules/chat/chat.service.js
backend/src/modules/ai/rag.service.js
backend/src/modules/ai/retrieval.service.js
backend/src/modules/ai/generation.service.js
```

---

# 12. AI Provider Routing

Backend menentukan provider AI otomatis.

Aturannya:

| Kondisi | Provider |
|---|---|
| Chat teks biasa | DeepSeek |
| Chat dengan gambar | Gemini Vision |
| Semantic embedding | Gemini Embedding |
| Provider gagal/API key kosong | Mock fallback |

Logika utamanya:

```js
const provider = imagePath ? "gemini_vision" : "deepseek";
```

Ini ada di:

```txt
backend/src/modules/ai/generation.service.js
```

Backend engineer juga menyiapkan fallback agar chat tetap berjalan saat provider gagal.

---

# 13. RAG Backend

RAG digunakan agar AI menjawab berdasarkan knowledge base internal.

Flow RAG:

1. User mengirim pesan.
2. Intent dicek.
3. Jika pertanyaan relevan helpdesk, retrieval berjalan.
4. Backend mencari `KnowledgeChunk`.
5. Context masuk ke prompt.
6. AI menjawab dengan acuan knowledge.

Retrieval mode:

- `keyword`: default, memakai text search.
- `semantic`: memakai embedding dan pgvector.
- `hybrid`: coba semantic lalu fallback keyword.

File penting:

```txt
backend/src/modules/ai/retrieval.service.js
backend/src/modules/ai/embedding.service.js
backend/src/modules/ai/prompt.service.js
```

---

# 14. Prompt Engineering di Backend

Prompt dibuat oleh backend, bukan frontend.

Tujuannya:

- Menjaga AI tetap menjawab dalam Bahasa Indonesia.
- Membatasi domain ke perangkat Epson.
- Meminta format Markdown yang rapi.
- Meminta langkah troubleshooting bertahap.
- Meminta maksimal 3 pertanyaan klarifikasi.
- Menyuruh AI menyebut knowledge base jika ada.
- Melarang AI mengarang kode error atau solusi spesifik tanpa rujukan.
- Menambahkan safety instruction untuk asap, bau terbakar, kabel rusak, cairan, atau panas berlebih.

File:

```txt
backend/src/modules/ai/prompt.service.js
```

Ini penting karena kualitas AI sangat dipengaruhi prompt backend.

---

# 15. Machine Learning Backend

ML berjalan lokal di backend.

Model:

- Multinomial Naive Bayes.

Task:

- Intent classification.
- Category classification.
- Priority classification.
- Escalation likelihood.

Training data:

- Seed examples dari kode.
- Training examples dari database.

Model disimpan ke:

```txt
MlModel
```

File penting:

```txt
backend/src/modules/ml/ml.service.js
backend/src/modules/ml/naive-bayes.js
backend/src/modules/ml/model-store.js
backend/src/modules/ml/seed-examples.js
```

---

# 16. Fungsi ML di Workflow

ML membantu backend membuat keputusan tambahan.

Contoh:

- Pesan "hasil cetak bergaris" diprediksi sebagai `Print Quality Issue`.
- Pesan "printer mati total produksi berhenti" diprediksi priority `HIGH`.
- Pesan sapaan seperti "halo" diprediksi sebagai `greeting`.
- Jika priority tinggi atau AI confidence rendah, sistem memberi sinyal eskalasi.

Nilai backend:

- Ticket lebih cepat dikategorikan.
- Dashboard popular issues lebih informatif.
- Helpdesk lebih mudah memprioritaskan kasus.
- Data chat bisa menjadi training signal setelah divalidasi.

---

# 17. Ticket Escalation Backend

Ticket dibuat dari chat session.

Flow:

1. User klik eskalasi.
2. Backend mengambil session dan messages.
3. Backend membuat summary percakapan.
4. Backend membuat `EscalationTicket`.
5. Session diubah menjadi `ESCALATED`.
6. Helpdesk bisa melihat ticket queue.

File utama:

```txt
backend/src/modules/tickets/tickets.service.js
```

Ticket menyimpan:

- User/requester.
- Session asal.
- Category.
- Summary.
- Status.
- Priority.
- Comments.
- Email logs.

---

# 18. Thread Komentar Ticket

Backend mendukung komunikasi dua arah:

- Helpdesk/admin bisa membalas ticket.
- Operator bisa membalas ticket.
- Operator bisa konfirmasi solusi berhasil atau belum.

Jika helpdesk membalas ticket yang masih `OPEN`, backend bisa mengubah status menjadi `IN_PROGRESS`.

Jika operator mengonfirmasi solusi berhasil:

- Ticket menjadi closed/resolved.
- Session terkait menjadi `RESOLVED`.
- Backend bisa membuat learning candidate.

Ini membuat ticket bukan hanya data statis, tetapi workflow penyelesaian kasus.

---

# 19. Report dan Email Backend

Backend menyediakan report flow:

- Generate summary dari session atau ticket.
- Kirim summary lewat email.
- Lampirkan gambar jika chat punya upload.
- Catat hasil pengiriman ke `EmailLog`.

File utama:

```txt
backend/src/modules/reports/reports.service.js
```

Email memakai:

```txt
Nodemailer
Mailpit untuk development
```

Jika SMTP gagal, backend tetap membuat email log dengan status `FAILED`.

Ini penting untuk audit trail.

---

# 20. File Upload Backend

Upload gambar dipakai untuk defect image.

Flow:

1. Frontend upload gambar ke `/api/files/upload`.
2. Backend validasi file.
3. File disimpan.
4. Metadata masuk `UploadedFile`.
5. Saat chat dikirim dengan `imageId`, backend ambil `storagePath`.
6. Jika ada image path, AI provider berpindah ke Gemini Vision.

File penting:

```txt
backend/src/modules/files/files.routes.js
backend/src/modules/files/files.middleware.js
backend/src/modules/files/files.service.js
backend/src/modules/files/storage.service.js
```

---

# 21. Knowledge Base Backend

Admin bisa membuat dan mengubah knowledge.

Saat knowledge dibuat:

1. Backend validasi title dan content.
2. Backend cek category jika ada.
3. Content dipecah menjadi chunks.
4. Chunks disimpan sebagai `KnowledgeChunk`.
5. Jika semantic RAG aktif, embedding dibuat.

File utama:

```txt
backend/src/modules/knowledge/knowledge.service.js
```

Keputusan teknis:

- RAG mencari chunk, bukan dokumen panjang.
- Ini membuat context lebih kecil dan fokus.
- Admin bisa memperbaiki kualitas AI dengan memperbarui knowledge.

---

# 22. Self-Learning Backend

Self-learning dibuat aman dan tidak otomatis masuk knowledge base.

Candidate dibuat ketika:

- User memberi feedback `UP` pada jawaban AI.
- Ticket menjadi `RESOLVED` atau `CLOSED`.
- Operator mengonfirmasi solusi berhasil.
- Admin/helpdesk membuat candidate manual dari session.

Syarat:

- Bukan temporary chat.
- Session tidak soft-deleted.
- Belum ada candidate pending untuk session yang sama.

Status awal:

```txt
PENDING
```

Candidate baru menjadi knowledge base hanya setelah di-approve.

---

# 23. Admin Backend

Admin backend menyediakan:

- Account approval.
- Analytics.
- Chat logs.
- Top issues.
- AI settings.
- Knowledge management.
- Category management.
- ML train/status/predict.
- Learning candidate review.

File utama:

```txt
backend/src/modules/admin/admin.service.js
backend/src/modules/categories/categories.service.js
backend/src/modules/knowledge/knowledge.service.js
backend/src/modules/ml/ml.service.js
backend/src/modules/ml/learning.service.js
```

Nilai admin backend:

- Sistem bisa dimonitor.
- Data bisa dikelola.
- Knowledge bisa diperbarui.
- AI dan ML tidak berjalan tanpa kontrol.

---

# 24. Error Handling dan Response Format

Backend memakai response format konsisten.

Utility penting:

```txt
backend/src/utils/response.js
backend/src/utils/apiError.js
backend/src/utils/asyncHandler.js
backend/src/middlewares/error.middleware.js
backend/src/middlewares/notfound.middleware.js
```

Tujuan:

- Controller lebih bersih.
- Error async tidak membuat server crash.
- Frontend menerima error message yang konsisten.
- Status code HTTP lebih jelas.

Contoh:

- `400` untuk input salah.
- `401` untuk token invalid/expired.
- `403` untuk role/access ditolak.
- `404` untuk data tidak ditemukan.
- `500` untuk kesalahan server.

---

# 25. Security yang Dikerjakan Backend

Security backend:

- Password tidak disimpan plain text.
- JWT diverifikasi di setiap protected route.
- Role-based access control.
- Account status harus aktif.
- User biasa hanya bisa akses chat, ticket, dan file miliknya.
- CORS origin dikontrol.
- Helmet security headers aktif.
- Upload file dibatasi lewat middleware.
- Secret/API key diambil dari `.env`, bukan hardcoded.

Hal penting:

Frontend guard membantu UX, tetapi security utama tetap harus ada di backend.

---

# 26. Environment dan Configuration

Backend config diambil dari `.env`.

File pembaca env:

```txt
backend/src/config/env.js
backend/src/config/ai.js
```

Contoh config penting:

```env
PORT=4000
DATABASE_URL=...
JWT_SECRET=...
DEEPSEEK_API_KEY=...
GEMINI_API_KEY=...
RAG_MODE=keyword
SMTP_HOST=localhost
SMTP_PORT=1025
CORS_ORIGIN=http://localhost:5173
```

Backend engineer harus memastikan:

- Secret tidak masuk git.
- Config punya fallback aman.
- Jika `.env` berubah, backend harus direstart.

---

# 27. Dokumentasi API

Backend menyediakan Swagger:

```txt
http://localhost:4000/api/docs
```

OpenAPI JSON:

```txt
http://localhost:4000/api/docs.json
```

Nilai dokumentasi:

- Frontend lebih mudah integrasi.
- Demo API bisa dilakukan langsung.
- Endpoint, request body, response, dan auth lebih jelas.
- Memudahkan testing manual.

File:

```txt
backend/src/config/openapi.js
```

---

# 28. Bukti Saat Presentasi

Hal yang bisa ditunjukkan sebagai backend engineer:

1. `app.js`
   - Route mounting.
   - Auth middleware.
   - Role middleware.

2. `schema.prisma`
   - Relasi user, chat, ticket, knowledge, ML.

3. `chat.service.js`
   - Pipeline chat ke ML, RAG, AI.

4. `generation.service.js`
   - Auto switch DeepSeek/Gemini Vision.

5. `retrieval.service.js`
   - RAG keyword/semantic/hybrid.

6. `ml.service.js`
   - Training dan prediction local ML.

7. `tickets.service.js`
   - Escalation dan ticket lifecycle.

8. `learning.service.js`
   - Candidate self-learning yang butuh review.

---

# 29. Demo dari Sudut Backend

Urutan demo backend:

1. Register operator.
   - Buktikan `PENDING`.

2. Admin approve.
   - Buktikan role dan account status dipakai.

3. User kirim chat print quality.
   - Buktikan session dan message tersimpan.
   - Buktikan AI provider dan confidence.
   - Buktikan context RAG.

4. Upload gambar.
   - Buktikan `imageId` masuk request.
   - Buktikan provider berubah ke `gemini_vision`.

5. Eskalasi ticket.
   - Buktikan ticket dibuat dari session.

6. Helpdesk balas.
   - Buktikan comment thread dan status berubah.

7. Resolve ticket.
   - Buktikan learning candidate muncul.

8. Admin approve candidate.
   - Buktikan candidate menjadi knowledge document.

---

# 30. Contoh Prompt Demo Backend

Prompt RAG:

```txt
Hasil cetak Epson bergaris atau banding setelah maintenance. Nozzle check menunjukkan missing dots di channel cyan. Apa yang harus dicek dulu?
```

Bukti:

- Context dari `Print Quality Banding Troubleshooting`.
- Category `Print Quality Issue`.
- Response AI tersimpan.

Prompt tanpa knowledge:

```txt
Printer Epson mengeluarkan suara berdecit keras saat dinyalakan, tapi tidak ada kode error di layar. Apa yang harus saya cek?
```

Bukti:

- Related context kosong.
- Jawaban berupa panduan umum aman.

Prompt gambar:

```txt
Saya lampirkan foto printer. Tolong identifikasi tipe printer jika label/model terlihat jelas.
```

Bukti:

- Request membawa `imageId`.
- Provider menjadi `gemini_vision`.

---

# 31. Tantangan Backend

Tantangan yang diselesaikan:

- Menjaga AI tetap aman dan tidak mengarang jawaban spesifik.
- Membuat RAG tetap berjalan walau embedding belum aktif.
- Membuat provider fallback agar chat tidak putus.
- Menjaga self-learning tetap melalui approval manusia.
- Menjaga access control antara USER, HELPDESK, dan ADMIN.
- Menyimpan data chat, ticket, image, email, ML, dan knowledge secara konsisten.
- Menghubungkan workflow AI ke workflow helpdesk nyata.

---

# 32. Nilai Backend untuk Produk

Backend membuat produk ini:

- Aman, karena auth dan role dikontrol server.
- Konsisten, karena semua data masuk database terstruktur.
- Bisa diaudit, karena chat, ticket, email, feedback, dan learning tersimpan.
- Adaptif, karena knowledge base bisa diperbarui admin.
- Pintar, karena AI memakai context dan ML membantu klasifikasi.
- Stabil, karena ada fallback ketika provider AI gagal.
- Siap dikembangkan, karena modul backend sudah dipisah berdasarkan domain.

---

# 33. Ringkasan Peran

Sebagai backend engineer, kontribusi utama adalah membangun fondasi teknis aplikasi:

- API server.
- Database schema.
- Auth dan role access.
- Chat pipeline.
- AI/RAG integration.
- ML local classifier.
- Ticket workflow.
- Report dan email log.
- Admin management.
- Self-learning governance.

Kesimpulan:

Backend engineer memastikan seluruh fitur frontend punya logika, data, keamanan, dan integrasi AI/ML yang berjalan benar di sisi server.


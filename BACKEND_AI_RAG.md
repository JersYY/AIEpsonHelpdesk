# Dokumentasi Backend dan AI RAG Epson Helpdesk

Dokumen ini menjelaskan bagian backend dan AI RAG pada project Epson Helpdesk. Fokusnya adalah memahami bagaimana API berjalan, bagaimana data disimpan, bagaimana chat diproses, bagaimana RAG mengambil knowledge base lalu menggunakannya untuk membantu Gemini menjawab pertanyaan user.

## 1. Backend

### Ringkasan Backend

Backend berada di folder `backend/` dan dibuat dengan Node.js, Express.js, Prisma, PostgreSQL, pgvector, JWT, bcrypt, multer, nodemailer, helmet, cors, dan morgan.

Backend berperan sebagai:

- API utama untuk frontend.
- Pengelola login dan role user.
- Pengelola chat session, chat message, dan history.
- Pengelola upload gambar defect.
- Pengelola knowledge base untuk RAG.
- Pengelola escalation ticket.
- Pengelola summary report dan email.
- Pengelola dashboard, admin analytics, dan chat logs.
- Boundary untuk integrasi AI/RAG dengan Gemini.

### Entry Point Aplikasi

File utama backend:

```txt
backend/src/server.js
backend/src/app.js
```

`server.js` bertugas menjalankan HTTP server:

- Mengambil port dari `env.PORT`, default `4000`.
- Menjalankan Express app.
- Menangani shutdown dengan memutus koneksi Prisma melalui `prisma.$disconnect()`.

`app.js` bertugas mengatur Express app:

- Menonaktifkan header `x-powered-by`.
- Mengaktifkan middleware global seperti `helmet`, `cors`, JSON parser, URL encoded parser, dan `morgan`.
- Mendaftarkan semua route backend.
- Menambahkan `notFound` dan `errorHandler` sebagai middleware terakhir.

Alur startup sederhana:

```txt
npm run dev
  -> nodemon src/server.js
  -> import app dari src/app.js
  -> app.listen(PORT)
  -> request masuk ke middleware dan routes
```

### Middleware Global

Backend memakai beberapa middleware utama:

| Middleware | File/Library | Fungsi |
|---|---|---|
| `helmet()` | `helmet` | Menambah HTTP security headers. |
| `cors()` | `cors` | Mengatur origin frontend dari `CORS_ORIGIN`. |
| `express.json()` | Express | Membaca request body JSON, limit 1 MB. |
| `express.urlencoded()` | Express | Membaca form URL encoded. |
| `morgan("dev")` | `morgan` | Logging request saat development. |
| `requireAuth` | `src/middlewares/auth.middleware.js` | Memvalidasi JWT dan mengisi `req.user`. |
| `authorizeRoles` | `src/middlewares/role.middleware.js` | Membatasi endpoint berdasarkan role. |
| `notFound` | `src/middlewares/notfound.middleware.js` | Menangani route yang tidak ditemukan. |
| `errorHandler` | `src/middlewares/error.middleware.js` | Menstandarkan response error. |

Route publik hanya:

```txt
GET  /api/health
POST /api/auth/register
POST /api/auth/login
```

Sebagian route auth lain seperti `/api/auth/me` dan `/api/auth/logout` juga memasang `requireAuth` langsung di route auth.

Setelah route publik, `app.js` memasang:

```js
app.use("/api", requireAuth);
```

Artinya semua route `/api/*` setelah baris tersebut wajib memakai JWT.

### Pola Struktur Modul

Backend memakai pola modular. Hampir semua fitur memiliki tiga lapisan:

```txt
routes -> controller -> service
```

Contoh pada chat:

```txt
chat.routes.js
  -> chat.controller.js
  -> chat.service.js
  -> Prisma / RAG / utility
```

Pembagian ini membuat tanggung jawab tiap file lebih jelas:

- `routes.js`: mendefinisikan HTTP method dan path.
- `controller.js`: membaca `req`, memanggil service, lalu mengirim response.
- `service.js`: berisi business logic utama dan akses database.

Folder utama:

```txt
backend/src/
  app.js
  server.js
  config/
  middlewares/
  modules/
    admin/
    ai/
    auth/
    chat/
    dashboard/
    files/
    health/
    knowledge/
    reports/
    tickets/
    users/
  utils/
```

### Konfigurasi Environment

Konfigurasi dibaca dari:

```txt
backend/src/config/env.js
backend/src/config/ai.js
backend/src/config/prisma.js
```

Environment penting:

| Env | Fungsi |
|---|---|
| `PORT` | Port backend, default `4000`. |
| `DATABASE_URL` | URL koneksi PostgreSQL. |
| `JWT_SECRET` | Secret untuk sign dan verify JWT. |
| `GEMINI_API_KEY` | API key Gemini. Jika kosong, AI fallback ke mock. |
| `GEMINI_MODEL` | Model Gemini untuk generate answer. |
| `GEMINI_EMBEDDING_MODEL` | Model Gemini untuk embedding. |
| `GEMINI_EMBEDDING_DIM` | Dimensi embedding, default `768`. |
| `RAG_MIN_SIMILARITY` | Threshold minimal similarity semantic retrieval. |
| `AI_MIN_RESPONSE_MS` | Delay minimum response AI agar UX terasa konsisten. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Konfigurasi pengiriman email. |
| `MAILPIT_WEB_URL` | URL inbox Mailpit yang dikembalikan oleh endpoint send-email, default `http://localhost:8025`. |
| `CORS_ORIGIN` | Origin frontend yang diizinkan. |

`config/prisma.js` membuat Prisma Client dengan adapter `@prisma/adapter-pg`. Saat bukan production, instance Prisma disimpan di `globalThis` agar tidak membuat koneksi berulang saat hot reload.

### Database dan Prisma

Database memakai PostgreSQL dengan Prisma. Schema utama ada di:

```txt
backend/prisma/schema.prisma
```

Model utama:

| Model | Fungsi |
|---|---|
| `User` | Data karyawan/admin/helpdesk, termasuk `employeeId`, email, password hash, role, `accountStatus`, department, dan catatan review akun. |
| `IssueCategory` | Kategori masalah seperti print quality, scanner, network, hardware, firmware, part. |
| `ChatSession` | Satu sesi percakapan user dengan AI. |
| `ChatMessage` | Pesan dalam sesi chat, bisa dari `USER`, `AI`, atau `SYSTEM`. |
| `UploadedFile` | Metadata gambar defect yang di-upload user. |
| `KnowledgeDocument` | Dokumen knowledge base yang dikelola admin. |
| `KnowledgeChunk` | Potongan isi dokumen knowledge yang dipakai retrieval RAG. |
| `SuggestedQuestion` | Pertanyaan rekomendasi terkait knowledge. |
| `EscalationTicket` | Ticket hasil eskalasi dari chat session. |
| `EmailLog` | Log pengiriman email summary report. |
| `MlModel` | Artifact model lokal seperti classifier kategori/intent/prioritas. |
| `TrainingExample` | Contoh training yang terkumpul dari feedback/conversation. |
| `KnowledgeCandidate` | Candidate knowledge dari self-learning yang harus direview sebelum masuk knowledge base. |

Enum penting:

```txt
UserRole: USER, ADMIN, HELPDESK
AccountStatus: PENDING, ACTIVE, REJECTED
ChatSessionStatus: ACTIVE, RESOLVED, ESCALATED
MessageSender: USER, AI, SYSTEM
TicketStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED
TicketPriority: LOW, MEDIUM, HIGH
EmailStatus: SENT, FAILED
FeedbackRating: UP, DOWN
KnowledgeCandidateStatus: PENDING, NEEDS_EDIT, APPROVED, REJECTED
RedactionStatus: PENDING, REDACTED
```

Relasi data utama:

```txt
User
  -> ChatSession
  -> UploadedFile
  -> EscalationTicket

ChatSession
  -> ChatMessage
  -> EscalationTicket
  -> IssueCategory

KnowledgeDocument
  -> KnowledgeChunk
  -> SuggestedQuestion
  -> IssueCategory

EscalationTicket
  -> EmailLog
  -> User
  -> ChatSession
  -> IssueCategory
```

Untuk RAG, model paling penting adalah:

```prisma
model KnowledgeChunk {
  id         String                 @id @default(uuid())
  documentId String
  chunkText  String                 @db.Text
  embedding  Unsupported("vector(768)")?
  metadata   Json?
  createdAt  DateTime              @default(now())
  document   KnowledgeDocument     @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

Kolom `embedding` memakai pgvector dengan dimensi `768`.

Migration RAG:

```txt
backend/prisma/migrations/20260506000000_rag_embeddings/migration.sql
```

Migration tersebut:

- Mengaktifkan extension `vector`.
- Mengubah kolom embedding menjadi `vector(768)`.
- Membuat index HNSW dengan `vector_cosine_ops`.

### Format Response API

Response sukses memakai format:

```json
{
  "success": true,
  "data": {}
}
```

Response error memakai format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": null
  }
}
```

Helper response ada di:

```txt
backend/src/utils/response.js
```

Error custom memakai `ApiError`, lalu diproses oleh:

```txt
backend/src/middlewares/error.middleware.js
```

Error handler juga menangani beberapa kasus khusus:

- `LIMIT_FILE_SIZE` dari multer menjadi HTTP 400.
- Prisma `P2002` duplicate field menjadi HTTP 409.
- Error 500 tetap di-log di server.

### Auth dan Role

Auth berada di:

```txt
backend/src/modules/auth/
backend/src/middlewares/auth.middleware.js
backend/src/middlewares/role.middleware.js
```

Register operator memakai:

```txt
POST /api/auth/register
```

Body:

```json
{
  "employeeId": "EMP002",
  "name": "Production Operator",
  "email": "operator.production@epson.local",
  "department": "Assembly",
  "password": "Password123!"
}
```

Hasil register adalah role `USER` dengan `accountStatus: PENDING`. User dapat login untuk melihat status, tetapi dashboard/chat/ticket tetap terkunci sampai admin approve.

Alur login:

```txt
AuthController.login()
  -> AuthService.login()
  -> cari user berdasarkan employeeId
  -> bcrypt.compare(password, passwordHash)
  -> jwt.sign({ sub, employeeId, role })
  -> return user tanpa passwordHash + token
```

JWT berlaku `1d`. Payload token menyimpan:

- `sub`: user id.
- `employeeId`: ID karyawan.
- `role`: role user.

Middleware `requireAuth`:

```txt
Authorization: Bearer <token>
  -> jwt.verify()
  -> cari user dari payload.sub
  -> sanitize user
  -> req.user = user
```

Middleware `authorizeRoles` dipakai untuk membatasi fitur, misalnya:

- Register publik membuat operator `USER` dengan `accountStatus: PENDING`; middleware `requireActiveAccount` menutup endpoint protected sampai admin approve.
- Admin knowledge hanya `ADMIN`.
- Ticket list/status hanya `ADMIN` dan `HELPDESK`.
- Admin analytics hanya `ADMIN`.

### Endpoint Backend

Endpoint utama:

| Area | Endpoint |
|---|---|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Dashboard | `GET /api/dashboard`, `GET /api/dashboard/popular-issues`, `GET /api/dashboard/recent-activity` |
| Chat | `POST /api/chat/message`, `GET /api/chat/history`, `GET /api/chat/sessions/:id`, rename/archive/delete/edit/regenerate/feedback endpoints |
| Files | `POST /api/files/upload`, `GET /api/files/:id`, `DELETE /api/files/:id` |
| Admin Categories | `GET /api/admin/categories`, `POST /api/admin/categories`, `PATCH /api/admin/categories/:id`, `DELETE /api/admin/categories/:id` |
| Admin Knowledge | `GET /api/admin/knowledge`, `POST /api/admin/knowledge`, `PUT /api/admin/knowledge/:id`, `DELETE /api/admin/knowledge/:id` |
| Admin Chat Logs | `GET /api/admin/chat-logs`, `GET /api/admin/chat-logs/:id` |
| Admin Analytics | `GET /api/admin/analytics`, `GET /api/admin/top-issues` |
| Admin Accounts | `GET /api/admin/accounts`, `PATCH /api/admin/accounts/:id/status` |
| Tickets | `POST /api/tickets/escalate`, `GET /api/tickets/my`, `GET /api/tickets/my/:id`, `GET /api/tickets`, `GET /api/tickets/:id`, `PATCH /api/tickets/:id/status` |
| Reports/Email | `POST /api/reports/summary`, `POST /api/reports/send-email`, `GET /api/email-logs` |
| Users | `GET/PATCH /api/users/me/preferences` |
| Learning | `GET /api/learning/candidates`, approve/reject candidate endpoints |
| ML | `GET /api/admin/ml/status`, train/predict endpoints |

Detail endpoint juga tersedia di:

```txt
backend/API.md
```

### Modul Auth

File:

```txt
backend/src/modules/auth/auth.routes.js
backend/src/modules/auth/auth.controller.js
backend/src/modules/auth/auth.service.js
```

Fungsi:

- Login user berdasarkan `employeeId`.
- Validasi password dengan bcrypt.
- Membuat JWT.
- Mengembalikan data user yang sudah disanitasi.
- Menyediakan endpoint `me` dan `logout`.

Catatan penting:

- Email bukan credential utama; login memakai `employeeId`.
- Password tidak pernah dikembalikan ke frontend karena memakai `sanitizeUser`.
- Jika `JWT_SECRET` belum diset, login atau validasi token akan gagal dengan error server.

### Modul Dashboard

File:

```txt
backend/src/modules/dashboard/
```

Endpoint:

```txt
GET /api/dashboard
GET /api/dashboard/popular-issues
GET /api/dashboard/recent-activity
```

Fungsi:

- Menampilkan dashboard user.
- Menghitung popular issue dari gabungan `ChatSession` non-temporary/non-deleted dan `EscalationTicket` per kategori dalam window 30 hari terakhir.
- Menampilkan recent activity user berdasarkan chat session terakhir.
- Menyediakan quick actions seperti start chat, view FAQ, dan report issue.

Jika belum ada aktivitas chat/ticket, popular issues fallback ke seed `IssueCategory` dengan `count: 0`. Frontend dashboard melakukan refresh berkala agar daftar ini terasa realtime tanpa WebSocket.

### Modul Chat

File:

```txt
backend/src/modules/chat/chat.routes.js
backend/src/modules/chat/chat.controller.js
backend/src/modules/chat/chat.service.js
backend/src/modules/chat/rag.service.js
```

Endpoint:

```txt
POST /api/chat/message
GET  /api/chat/history
GET  /api/chat/sessions/:id
```

Alur `POST /api/chat/message`:

```txt
User kirim message dan optional imageId
  -> validasi message atau imageId wajib ada
  -> jika imageId ada, validasi file dan ownership
  -> jika sessionId ada, pakai session lama
  -> jika sessionId tidak ada, buat ChatSession baru
  -> simpan ChatMessage sender USER
  -> RagService.searchRelevantChunks()
  -> RagService.generateAnswer()
  -> tunggu minimal AI_MIN_RESPONSE_MS jika perlu
  -> hitung responseTimeMs
  -> simpan ChatMessage sender AI
  -> return session, userMessage, aiMessage, contexts, provider
```

`aiMessage.knowledgeGrounded` ikut dikirim pada jawaban baru, edit, regenerate, dan temporary mode. Nilai `false` berarti tidak ada context knowledge base yang cocok; frontend menampilkan catatan agar operator dapat eskalasi bila masih ragu.

Validasi akses:

- Role `USER` hanya boleh mengakses session miliknya sendiri.
- Role `ADMIN` dan `HELPDESK` bisa melihat lebih luas sesuai endpoint.

Data yang disimpan saat chat:

- Pesan user disimpan ke `ChatMessage`.
- Jawaban AI disimpan ke `ChatMessage`.
- `confidenceScore` disimpan di pesan AI.
- `responseTimeMs` disimpan di pesan AI.
- Jika ada gambar, `imageId` disimpan di pesan user.

`confidenceScore` dihitung dari:

- Skor retrieval context teratas.
- Boost kecil jika provider adalah `gemini`.
- Nilai fallback jika tidak ada score tetapi ada context.
- Nilai lebih rendah jika tidak ada context.

### Modul Files

File:

```txt
backend/src/modules/files/
```

Endpoint:

```txt
POST   /api/files/upload
GET    /api/files/:id
DELETE /api/files/:id
```

Fungsi:

- Upload gambar defect dengan multer.
- Menyimpan file fisik di folder `uploads/`.
- Menyimpan metadata di tabel `UploadedFile`.
- Mengambil metadata file.
- Menghapus metadata dan file fisik.

Ketentuan upload:

- Field multipart: `file`.
- MIME type yang diizinkan:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- Maksimal ukuran file: 5 MB.

Validasi akses:

- Role `USER` hanya boleh mengakses file miliknya.
- Role selain `USER` dapat mengakses file lebih luas sesuai kebutuhan operasional.

### Modul Categories

File:

```txt
backend/src/modules/categories/
```

Endpoint admin:

```txt
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

Fungsi:

- Category menjadi master data untuk chat session, escalation ticket, knowledge document, dan learning candidate.
- Admin dapat membuat category terlebih dahulu dari tab Categories, atau quick-create category saat membuat dokumen knowledge.
- Delete category diblokir jika category masih dipakai data lain. Response error menyertakan usage count agar admin tahu data mana yang perlu dipindahkan/dihapus dulu.

### Modul Knowledge Base

File:

```txt
backend/src/modules/knowledge/
```

Endpoint admin:

```txt
GET    /api/admin/knowledge
POST   /api/admin/knowledge
PUT    /api/admin/knowledge/:id
DELETE /api/admin/knowledge/:id
```

Fungsi:

- Admin dapat melihat, membuat, mengubah, dan menghapus dokumen knowledge.
- Dokumen knowledge dapat dihubungkan ke `IssueCategory`; category dapat dibuat dari fitur category master sebelum dokumen dibuat.
- Setiap `KnowledgeDocument` otomatis dipecah menjadi `KnowledgeChunk`.
- Setiap chunk dapat dibuatkan embedding Gemini dan disimpan ke pgvector.

Alur create knowledge:

```txt
Admin kirim title, content, source, categoryId
  -> validasi title dan content wajib ada
  -> validasi categoryId jika dikirim
  -> buat KnowledgeDocument dalam transaction
  -> pecah content menjadi chunks
  -> createMany KnowledgeChunk
  -> refreshDocumentEmbeddings()
  -> return document lengkap dengan category, questions, chunks
```

Chunking:

- Content dipisah berdasarkan paragraf kosong.
- Maksimal panjang chunk default sekitar 900 karakter.
- Metadata chunk berisi `chunkIndex` dan `source`.

Update knowledge:

- Jika `content` berubah, chunk lama dihapus dan dibuat ulang.
- Jika `title` atau `content` berubah, embedding di-refresh.

Delete knowledge:

- Menghapus `KnowledgeDocument`.
- Karena relasi `KnowledgeChunk` memakai cascade, chunk terkait ikut terhapus.

### Modul Tickets

File:

```txt
backend/src/modules/tickets/
```

Endpoint:

```txt
POST  /api/tickets/escalate
GET   /api/tickets
GET   /api/tickets/:id
PATCH /api/tickets/:id/status
```

Fungsi:

- Membuat escalation ticket dari chat session.
- Membuat ringkasan ticket multi-section berisi masalah utama, konteks pemohon/kategori/prioritas, respons AI terakhir, tindak lanjut helpdesk, lampiran, dan riwayat singkat.
- Mengubah status ticket.
- Mengubah status chat session menjadi `ESCALATED` saat ticket dibuat.
- Mengubah status chat session menjadi `RESOLVED` jika ticket selesai atau ditutup.
- `GET /api/tickets/:id` untuk `ADMIN`/`HELPDESK` mengembalikan `session.messages[]` read-only agar UI detail ticket dapat menampilkan history chat.

Alur eskalasi:

```txt
User/Admin/Helpdesk kirim sessionId dan priority
  -> validasi session
  -> validasi ownership jika role USER
  -> ambil messages session
  -> buildConversationSummary() multi-section
  -> buat EscalationTicket status OPEN
  -> update ChatSession status ESCALATED
  -> return ticket
```

Role:

- `USER`, `ADMIN`, `HELPDESK` boleh membuat eskalasi.
- Hanya `ADMIN` dan `HELPDESK` boleh melihat list ticket dan mengubah status.

### Modul Reports dan Email

File:

```txt
backend/src/modules/reports/
```

Endpoint:

```txt
POST /api/reports/summary
POST /api/reports/send-email
GET  /api/email-logs
```

Fungsi:

- Membuat summary dari chat session atau ticket.
- Mengirim summary via email.
- Melampirkan gambar defect dari chat sebagai attachment email.
- Menyimpan log email ke `EmailLog`.
- Mengembalikan `source.ticketId`, `source.sessionId`, dan `mailpitUrl` agar frontend bisa membuka Mailpit, Email Logs, atau history chat terkait.

Alur send email:

```txt
Request berisi sessionId atau ticketId dan recipientEmail
  -> validasi sumber report
  -> validasi ownership jika role USER
  -> generate summary
  -> ambil attachment dari ChatMessage.image
  -> nodemailer kirim email
  -> simpan EmailLog SENT atau FAILED
  -> return status pengiriman, source, mailpitUrl, summary, attachments
```

Untuk development, backend bisa memakai Mailpit dengan:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
MAILPIT_WEB_URL=http://localhost:8025
```

### Modul Admin

File:

```txt
backend/src/modules/admin/
```

Endpoint:

```txt
GET /api/admin/chat-logs
GET /api/admin/chat-logs/:id
GET /api/admin/analytics
GET /api/admin/top-issues
GET /api/admin/accounts
PATCH /api/admin/accounts/:id/status
```

Fungsi:

- Melihat chat logs semua user.
- Melihat detail satu chat session lengkap dengan messages dan escalation tickets.
- Meninjau akun operator baru dan mengubah status approval menjadi `ACTIVE` atau `REJECTED`.
- Menghitung analytics:
  - `deflectionRate`
  - `avgResponseTime`
  - `totalQueries`
  - `resolutionRate`
  - `totalEscalations`
  - `totalSessions`
- Menghitung top issues dari gabungan chat session dan escalation ticket per kategori.

Route admin utama dilindungi dengan:

```txt
authorizeRoles("ADMIN")
```

### Health Check

Endpoint:

```txt
GET /api/health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "epson-helpdesk-api",
    "timestamp": "..."
  }
}
```

Endpoint ini publik dan berguna untuk memastikan backend hidup.

### Script Backend

Script tersedia di `backend/package.json`:

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "prisma db seed",
  "rag:backfill": "node prisma/backfill-embeddings.js"
}
```

Script penting:

- `npm run dev`: menjalankan backend development.
- `npm start`: menjalankan backend biasa.
- `npm run prisma:generate`: generate Prisma Client.
- `npm run prisma:migrate`: menjalankan migration development.
- `npm run prisma:seed`: mengisi data demo.
- `npm run rag:backfill`: mengisi embedding untuk knowledge chunk lama.

## 2. AI RAG

### Apa Itu RAG di Project Ini

RAG adalah singkatan dari Retrieval-Augmented Generation. Di project ini, RAG berarti AI tidak hanya menjawab dari pengetahuan umum model, tetapi terlebih dahulu mengambil context dari knowledge base internal Epson, lalu context tersebut dimasukkan ke prompt Gemini.

Tujuannya:

- Jawaban lebih sesuai SOP/internal knowledge.
- Jawaban dapat dikaitkan dengan dokumen sumber.
- Knowledge dapat diperbarui oleh admin tanpa fine-tuning model.
- Sistem tetap bisa berjalan walaupun Gemini API tidak aktif, karena ada fallback keyword/mock.

Catatan penting: istilah "self-learning" di project ini berarti knowledge base baru otomatis dipakai setelah admin menambah atau mengubah dokumen. Ini bukan training otomatis dari percakapan user.

### File Utama AI RAG

Folder AI:

```txt
backend/src/modules/ai/
  ai.service.js
  rag.service.js
  retrieval.service.js
  embedding.service.js
  generation.service.js
  prompt.service.js
  intent.service.js
  providers/
    gemini.provider.js
```

Tanggung jawab file:

| File | Tanggung jawab |
|---|---|
| `ai.service.js` | Facade sederhana untuk menjawab pertanyaan helpdesk dari modul lain. |
| `rag.service.js` | Orkestrator retrieval, prompt, dan generation. |
| `retrieval.service.js` | Mencari chunk knowledge relevan memakai semantic pgvector dan fallback keyword. |
| `embedding.service.js` | Membuat embedding Gemini, validasi dimensi, dan menyimpan embedding ke pgvector. |
| `generation.service.js` | Memanggil Gemini untuk generate answer, lalu fallback ke mock answer jika gagal. |
| `prompt.service.js` | Menyusun prompt helpdesk dengan context knowledge base. |
| `intent.service.js` | Filter intent sederhana agar retrieval tidak berjalan untuk greeting, aritmetika, atau pertanyaan di luar domain. |
| `providers/gemini.provider.js` | Integrasi REST ke Gemini `generateContent` dan `embedContent`. |

Ada juga compatibility wrapper lama:

```txt
backend/src/modules/chat/rag.service.js
```

File ini meneruskan pemanggilan ke AI RAG service yang aktif.

### Alur Besar RAG Saat Chat

Alur dari user sampai jawaban AI:

```txt
POST /api/chat/message
  -> ChatService.sendMessage()
  -> simpan pesan USER
  -> RagService.searchRelevantChunks(message)
  -> RetrievalService.searchRelevantChunks(message)
  -> PromptService.buildHelpdeskPrompt(message, contexts)
  -> GenerationService.generateAnswer(prompt, contexts, imagePath)
  -> GeminiProvider.generateAnswer()
  -> simpan pesan AI
  -> return contexts, provider, confidenceScore
```

Jika digambarkan lebih detail:

```txt
User message
  -> Intent filter
  -> Query embedding Gemini
  -> pgvector semantic search
  -> jika semantic cocok, ambil top chunks
  -> jika semantic gagal/kosong, fallback keyword/full-text
  -> build grounded prompt
  -> Gemini generate answer
  -> jika Gemini gagal/kosong, fallback mock answer
  -> response dikirim ke frontend
```

### Ingestion Knowledge Base

RAG membutuhkan knowledge base. Knowledge base dibuat atau diubah lewat endpoint admin:

```txt
POST /api/admin/knowledge
PUT  /api/admin/knowledge/:id
```

Alurnya:

```txt
Admin membuat/mengubah KnowledgeDocument
  -> KnowledgeService.create/update()
  -> content dipotong menjadi beberapa KnowledgeChunk
  -> setiap chunk disimpan ke database
  -> EmbeddingService.embedAndSaveKnowledgeChunk()
  -> Gemini embedContent dengan taskType RETRIEVAL_DOCUMENT
  -> embedding disimpan ke KnowledgeChunk.embedding
```

Chunking dilakukan di `KnowledgeService`:

- Content dinormalisasi dari CRLF ke LF.
- Content dipisah berdasarkan paragraph break.
- Paragraph digabung sampai mendekati batas `maxLength`, default 900 karakter.
- Setiap chunk diberi metadata:

```json
{
  "chunkIndex": 0,
  "source": "document-content"
}
```

Saat seeding data, metadata source bisa berisi `"seed"`.

### Embedding

Embedding adalah representasi angka dari teks. Dalam project ini embedding dipakai agar sistem bisa mencari knowledge yang maknanya mirip dengan pertanyaan user, bukan hanya keyword yang sama persis.

Service:

```txt
backend/src/modules/ai/embedding.service.js
```

Provider:

```txt
backend/src/modules/ai/providers/gemini.provider.js
```

Untuk document chunk:

```txt
taskType = RETRIEVAL_DOCUMENT
```

Untuk pertanyaan user:

```txt
taskType = RETRIEVAL_QUERY
```

Embedding divalidasi:

- Harus array.
- Semua nilai harus angka valid.
- Panjang array harus sama dengan `GEMINI_EMBEDDING_DIM`, default `768`.

Embedding disimpan ke PostgreSQL dengan SQL raw:

```sql
UPDATE "KnowledgeChunk"
SET embedding = $vector::vector
WHERE id = $chunkId
```

Format vector literal:

```txt
[0.1,0.2,0.3,...]
```

Jika `GEMINI_API_KEY` kosong, embedding tidak dibuat dan proses knowledge tetap lanjut.

### Backfill Embedding

Jika knowledge sudah ada sebelum embedding aktif, gunakan:

```bash
npm run rag:backfill
```

Script:

```txt
backend/prisma/backfill-embeddings.js
```

Alur backfill:

```txt
cari KnowledgeChunk dengan embedding NULL
  -> proses per batch
  -> generate embedding RETRIEVAL_DOCUMENT
  -> simpan embedding
  -> tampilkan progress
```

Opsi:

```bash
npm run rag:backfill -- --batch-size=10 --max-chunks=200
```

Jika `GEMINI_API_KEY` kosong, script akan menampilkan pesan bahwa backfill dilewati.

### Intent Filter

Sebelum retrieval, sistem memeriksa intent lewat:

```txt
backend/src/modules/ai/intent.service.js
```

Retrieval akan dilewati jika:

- Pesan hanya greeting, misalnya `halo`, `hai`, `pagi`.
- Pesan adalah aritmetika sederhana, misalnya `2 + 2`.
- Pesan tidak terlihat sebagai pertanyaan helpdesk Epson.

Tujuan intent filter:

- Mengurangi panggilan embedding yang tidak perlu.
- Mencegah knowledge base dipakai untuk pertanyaan di luar domain.
- Membuat jawaban greeting dan pertanyaan non-helpdesk lebih terkontrol.

Domain helpdesk dikenali dari keyword seperti:

```txt
printer, scanner, print, nozzle, banding, jaringan, firmware,
hardware, part, ink, kertas, sensor, jam, error, maintenance
```

### Retrieval Semantic dengan pgvector

Retrieval utama berada di:

```txt
backend/src/modules/ai/retrieval.service.js
```

Alur semantic search:

```txt
message user
  -> EmbeddingService.embedText(taskType RETRIEVAL_QUERY)
  -> vector literal
  -> query pgvector
  -> hitung cosine similarity
  -> filter score >= RAG_MIN_SIMILARITY
  -> return top chunks
```

SQL utama memakai operator pgvector:

```sql
1 - (kc.embedding <=> query_vector) AS score
ORDER BY kc.embedding <=> query_vector
```

`<=>` adalah cosine distance. Karena distance makin kecil makin mirip, service mengubahnya menjadi score similarity dengan:

```txt
score = 1 - cosine_distance
```

Hasil semantic retrieval berisi:

- `id`
- `documentId`
- `chunkText`
- `metadata`
- `createdAt`
- `documentTitle`
- `source`
- `score`
- `retrievalMode = "semantic"`

Default limit adalah 5, tetapi service membatasi limit antara 1 sampai 20.

### Fallback Retrieval

Jika semantic retrieval gagal, kosong, tidak grounded, Gemini API key kosong, atau pgvector bermasalah, sistem fallback ke keyword search.

Fallback keyword memakai:

- PostgreSQL full-text search `to_tsvector` dan `plainto_tsquery`.
- `ILIKE` pada chunk text.
- `ILIKE` pada document title.

Jika query raw keyword gagal, service fallback lagi ke Prisma `contains` berdasarkan token.

Jika keyword tetap tidak menemukan hasil, service mengambil chunk terbaru dengan mode:

```txt
retrievalMode = "recent"
```

Namun sebelum dikembalikan, hasil retrieval tetap dicek dengan:

```txt
IntentService.hasGroundedContext()
```

Jika context tidak dianggap relevan dengan token penting dari pertanyaan user, service mengembalikan array kosong.

### Prompt Grounding

Prompt disusun di:

```txt
backend/src/modules/ai/prompt.service.js
```

Prompt berisi instruksi utama:

- AI adalah Epson AI Helpdesk Assistant untuk troubleshooting internal manufaktur.
- Jawab dalam Bahasa Indonesia.
- Gunakan knowledge base sebagai sumber utama.
- Jika context tidak cukup, jelaskan informasi yang kurang.
- Berikan langkah troubleshooting yang ringkas, aman, dan bertahap.
- Sebutkan source paling relevan jika mendukung jawaban.
- Jangan membocorkan API key, secret, atau detail database.

Context diformat seperti:

```txt
[1] Print Quality Banding Troubleshooting
Source: Internal SOP PQ-001
Relevance: 0.812
Retrieval: semantic
Content: ...
```

Jika tidak ada context:

```txt
No matching knowledge base context was found.
```

### Generation dengan Gemini

Generation berada di:

```txt
backend/src/modules/ai/generation.service.js
backend/src/modules/ai/providers/gemini.provider.js
```

`GenerationService.generateAnswer()` mencoba memanggil Gemini:

```txt
GeminiProvider.generateAnswer({ prompt, imagePath })
```

Jika Gemini mengembalikan teks, response provider adalah:

```json
{
  "provider": "gemini",
  "text": "..."
}
```

Jika Gemini gagal, API key kosong, request timeout, response diblokir safety, atau tidak ada teks, service memakai fallback mock:

```json
{
  "provider": "mock",
  "text": "..."
}
```

Mock answer tetap dibuat kontekstual:

- Jika context berisi banding/nozzle/missing dots, jawaban mengarah ke print quality troubleshooting.
- Jika context berisi ADF/scanner/jam, jawaban mengarah ke scanner troubleshooting.
- Jika context berisi network/IP/subnet, jawaban mengarah ke network troubleshooting.
- Jika pertanyaan greeting, jawaban memperkenalkan Epson AI Helpdesk.
- Jika pertanyaan di luar domain, sistem menolak dengan sopan dan meminta gejala helpdesk yang relevan.

### Gemini Provider

File:

```txt
backend/src/modules/ai/providers/gemini.provider.js
```

Provider ini memanggil REST API Gemini:

```txt
https://generativelanguage.googleapis.com/v1beta
```

Fungsi utama:

- `generateAnswer()`: memanggil `models/{model}:generateContent`.
- `embedText()`: memanggil `models/{embeddingModel}:embedContent`.

Request Gemini memakai header:

```txt
x-goog-api-key: GEMINI_API_KEY
Content-Type: application/json
```

Generation config:

- `temperature` dari `GEMINI_TEMPERATURE`.
- `maxOutputTokens` dari `GEMINI_MAX_OUTPUT_TOKENS`.
- `safetySettings` dari `GEMINI_SAFETY_THRESHOLD`.

Provider juga memiliki:

- Timeout dengan `AbortController`.
- Retry terbatas berdasarkan `GEMINI_MAX_RETRIES`.
- Backoff sederhana `250 * 2 ** attempt`.
- Retry untuk timeout, status 429, status 5xx, atau error tanpa status.

### RAG dengan Gambar Defect

Project ini mendukung chat dengan gambar.

Alur:

```txt
POST /api/files/upload
  -> simpan gambar ke uploads/
  -> simpan metadata UploadedFile
  -> return imageId

POST /api/chat/message
  -> kirim message + imageId
  -> ChatService validasi file
  -> imagePath dikirim ke RagService.generateAnswer()
  -> GeminiProvider membaca file dan mengubahnya ke base64
  -> gambar dikirim sebagai inline_data ke Gemini
```

MIME type yang didukung untuk Gemini:

- `.jpg` atau `.jpeg` -> `image/jpeg`
- `.png` -> `image/png`
- `.webp` -> `image/webp`

Payload image ke Gemini berbentuk:

```json
{
  "inline_data": {
    "mime_type": "image/png",
    "data": "base64..."
  }
}
```

Dengan ini, Gemini menerima:

- Prompt troubleshooting.
- Context knowledge base hasil retrieval.
- Gambar defect jika ada.

### Confidence Score

Confidence score dihitung di:

```txt
backend/src/modules/chat/chat.service.js
```

Logikanya:

- Ambil score context teratas jika ada.
- Jika provider `gemini`, tambahkan boost `0.1`.
- Clamp nilai antara `0.4` dan `0.95`.
- Jika context ada tetapi tidak punya score, pakai default:
  - `0.74` untuk Gemini.
  - `0.62` untuk mock.
- Jika tidak ada context:
  - `0.55` untuk Gemini.
  - `0.45` untuk mock.

Score ini bukan kepastian matematis mutlak. Score lebih tepat dibaca sebagai indikator kualitas retrieval dan provider yang digunakan.

### Fallback Strategy

Backend sengaja dibuat tetap usable walaupun AI eksternal bermasalah.

Fallback yang tersedia:

| Kondisi | Fallback |
|---|---|
| `GEMINI_API_KEY` kosong | Generation memakai mock answer. |
| Embedding gagal | Semantic retrieval dilewati. |
| pgvector query error | Keyword search dipakai. |
| Keyword raw SQL error | Prisma token contains dipakai. |
| Tidak ada keyword result | Recent chunks dicoba. |
| Context tidak grounded | Context dikosongkan. |
| Gemini generate gagal | Mock answer dipakai. |
| Upload file tidak valid | Request ditolak dengan error 400. |

Keuntungan strategi ini:

- Chat tidak langsung rusak saat quota Gemini habis.
- Backend tetap bisa demo tanpa API key.
- Knowledge base tetap berguna melalui keyword search.
- Error eksternal tidak bocor langsung ke user.

### Security AI RAG

Hal penting yang sudah diperhatikan:

- `GEMINI_API_KEY` hanya dibaca di backend.
- API key tidak dikirim ke frontend.
- Prompt menginstruksikan model agar tidak membocorkan secret dan detail database.
- Semua endpoint chat/file/knowledge/ticket dilindungi JWT.
- Role admin dipakai untuk knowledge management.
- File upload dibatasi MIME type dan ukuran.
- User biasa tidak boleh memakai file atau session milik user lain.

Hal yang sebaiknya ditambahkan untuk production:

- Rate limit untuk endpoint chat dan upload.
- Structured AI logs tanpa menyimpan prompt penuh yang sensitif.
- Audit log untuk perubahan knowledge base.
- Validasi file signature, bukan hanya MIME type dari upload.
- Monitoring quota dan latency Gemini.
- Evaluasi retrieval dengan dataset pertanyaan-jawaban internal.
- Redaction data sensitif sebelum prompt dikirim ke model.

### Contoh Alur End-to-End

Contoh user bertanya:

```txt
Output printer muncul garis banding setelah maintenance. Apa yang harus dicek?
```

Alur internal:

```txt
1. Frontend mengirim POST /api/chat/message dengan JWT.
2. requireAuth memvalidasi token dan mengisi req.user.
3. ChatService membuat atau memakai ChatSession.
4. Pesan user disimpan ke ChatMessage.
5. IntentService mendeteksi ini pertanyaan helpdesk karena ada kata printer/banding/maintenance.
6. EmbeddingService membuat query embedding dengan task RETRIEVAL_QUERY.
7. RetrievalService mencari KnowledgeChunk terdekat memakai pgvector.
8. Chunk seperti "Print Quality Banding Troubleshooting" masuk ke contexts.
9. PromptService menyusun prompt Bahasa Indonesia dengan context tersebut.
10. GeminiProvider memanggil generateContent.
11. Jawaban Gemini disimpan sebagai ChatMessage sender AI.
12. API mengembalikan session, userMessage, aiMessage, contexts, dan provider.
```

Jika Gemini tidak aktif:

```txt
Langkah 1 sampai 9 tetap bisa berjalan.
GenerationService akan memakai mockAnswer berdasarkan context.
Response tetap dikirim dengan provider "mock".
```

### Perbedaan Semantic Search dan Keyword Search

Keyword search mencari kata yang sama atau mirip secara teks:

```txt
query: "garis pada output"
keyword search: mencari chunk yang mengandung "garis" atau "output"
```

Semantic search mencari kedekatan makna:

```txt
query: "hasil cetak muncul garis"
semantic search: bisa menemukan chunk tentang "banding" walaupun kata "banding" tidak diketik user
```

Karena itu semantic search lebih cocok untuk helpdesk, karena operator bisa menjelaskan masalah dengan bahasa berbeda dari SOP.

### Data Seed untuk RAG

Seed awal berada di:

```txt
backend/prisma/seed.js
```

Seed membuat:

- 2 akun demo:
  - `ADM001` sebagai `ADMIN`
  - `HD001` sebagai `HELPDESK`
- 6 kategori issue:
  - Print Quality Issue
  - Scanner Error
  - Network Issue
  - Hardware Problem
  - Firmware Problem
  - Part Problem
- 3 dokumen knowledge awal:
  - Print Quality Banding Troubleshooting
  - Scanner ADF Jam Recovery
  - Network Printer Discovery Checklist

Title dokumen knowledge memakai bahasa Inggris, sedangkan isi/deskripsi SOP memakai bahasa Indonesia agar demo RAG terasa natural untuk operator lokal. Seed tidak lagi membuat akun operator `USER` atau data operasional tambahan seperti chat, tickets, email logs, learning candidates, atau suggested questions. Data tersebut dibuat manual dari UI/API sesuai kebutuhan demo.

Setelah seed, jalankan backfill embedding jika Gemini API key tersedia:

```bash
npm run rag:backfill
```

### Cara Menjalankan Backend

Dari root project:

```bash
cd backend
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run rag:backfill
npm run dev
```

Backend berjalan di:

```txt
http://localhost:4000
```

Health check:

```txt
GET http://localhost:4000/api/health
```

### Catatan Pengembangan

Beberapa area yang bisa dikembangkan:

- Tambahkan rate limiting untuk chat dan upload.
- Tambahkan endpoint untuk suggested questions jika frontend perlu mengambilnya langsung.
- Tambahkan evaluasi RAG otomatis untuk menguji apakah pertanyaan tertentu mengambil chunk yang benar.
- Tambahkan observability khusus AI:
  - provider
  - retrieval mode
  - top score
  - latency embedding
  - latency generation
  - fallback reason
- Tambahkan audit trail untuk create/update/delete knowledge.
- Tambahkan review flow agar knowledge baru harus disetujui sebelum dipakai RAG.
- Tambahkan cache embedding untuk query yang sering ditanyakan.
- Tambahkan reranking jika jumlah knowledge base semakin besar.

### Kesimpulan

Backend project Epson Helpdesk sudah disusun sebagai API modular dengan Express dan Prisma. Fitur operasional seperti auth, chat, upload file, knowledge base, ticket, report email, dashboard, admin analytics, ML lokal, dan self-learning review dipisahkan dalam module masing-masing.

AI RAG menjadi lapisan yang menghubungkan chat dengan knowledge base internal. Admin mengelola dokumen knowledge, backend memecah dokumen menjadi chunk, Gemini membuat embedding, pgvector menyimpan dan mencari chunk paling relevan, lalu Gemini menjawab dengan prompt yang sudah diberi context. Jika AI eksternal tidak tersedia, backend tetap berjalan memakai fallback keyword dan mock answer.

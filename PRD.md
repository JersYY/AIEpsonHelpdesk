# PRD dan Dokumentasi Teknis Epson AI Helpdesk

Status: Draft implementasi
Tanggal update: 2026-06-05
Scope: Backend, Frontend, AI RAG, dan README proyek

## 1. Ringkasan Produk

Epson AI Helpdesk adalah aplikasi internal untuk membantu employee menyelesaikan masalah printer, scanner, jaringan, kualitas cetak, dan workflow produksi melalui chat AI berbasis RAG. Aplikasi ini juga menyediakan eskalasi ticket ke helpdesk, FAQ/knowledge base, dashboard aktivitas, upload gambar defect, report email, dan panel admin untuk mengelola knowledge serta analytics.

Dokumen ini menjadi PRD utama sekaligus dokumentasi teknis end-to-end. Tujuannya bukan hanya menjelaskan desain frontend ChatGPT-style, tetapi juga menyinkronkan kebutuhan frontend dengan backend yang benar-benar tersedia di kode saat ini.

Keputusan desain utama:

- Chat menjadi pengalaman utama aplikasi.
- UI mengikuti interaction model ChatGPT: sidebar riwayat, main conversation, composer di bawah.
- Backend tetap memakai Express modular route-controller-service.
- AI memakai RAG berbasis knowledge base, Gemini generation, Gemini embedding, PostgreSQL, dan pgvector.
- Self-learning tidak berarti model langsung dilatih dari chat mentah. Self-learning harus melalui candidate review sebelum masuk knowledge base.
- Temporary mode wajib tidak masuk history dan tidak dipakai self-learning.

## 2. Tujuan

### 2.1 Tujuan Produk

- Mengurangi waktu employee dalam mencari solusi teknis.
- Membuat pencarian SOP/FAQ terasa seperti percakapan natural.
- Memberi jalur eskalasi yang jelas saat AI belum cukup membantu.
- Membantu helpdesk melihat, memprioritaskan, dan menyelesaikan ticket.
- Membantu admin mengelola knowledge base yang dipakai RAG.
- Menjadikan dokumentasi backend, frontend, AI, dan README konsisten.

### 2.2 Tujuan Teknis

- Menyelaraskan endpoint backend dengan service frontend.
- Menyediakan OpenAPI/Swagger sebagai sumber dokumentasi API.
- Menghindari frontend memanggil endpoint yang belum tersedia.
- Menjaga boundary module backend agar mudah dirawat.
- Menjaga AI tetap grounded pada knowledge internal.
- Menyiapkan redesign frontend yang bisa diimplementasikan bertahap.

### 2.3 Non-goals

- Tidak mengganti stack backend dari Express/Prisma/PostgreSQL.
- Tidak mengganti stack frontend dari Vue/Vite/Pinia/Axios.
- Tidak membuat landing page marketing.
- Tidak melakukan fine-tuning model AI.
- Tidak mengizinkan knowledge base otomatis berubah dari chat tanpa review.
- Tidak menaruh credential atau secret di dokumentasi.

## 3. Persona dan Role

### 3.1 USER / Employee

Employee adalah pengguna utama aplikasi. Mereka memakai aplikasi untuk bertanya ke AI, upload gambar defect, membaca FAQ, membuat ticket eskalasi, dan melihat status ticket miliknya sendiri.

Kebutuhan:

- Login dengan `employeeId` dan password.
- Membuat chat baru dengan AI.
- Melanjutkan chat lama.
- Menggunakan temporary mode.
- Upload gambar defect.
- Melihat related FAQ/SOP dari jawaban AI.
- Eskalasi chat menjadi ticket.
- Melihat daftar ticket miliknya sendiri.
- Menghapus, rename, dan edit chat jika endpoint tersedia.
- Mengubah tema light, dark, atau system.

Prioritas UX:

- Cepat sampai ke chat.
- Navigasi sederhana.
- Tidak perlu memahami struktur knowledge base.
- Aksi penting selalu dekat dengan conversation.

### 3.2 HELPDESK

Helpdesk adalah operator yang memproses ticket hasil eskalasi.

Kebutuhan:

- Melihat queue ticket.
- Filter ticket berdasarkan status, priority, category, dan keyword.
- Membuka detail ticket.
- Melihat ringkasan chat dan evidence.
- Update status ticket.
- Membuat atau mengirim summary report.
- Melihat email log.

Prioritas UX:

- Triage cepat.
- Data padat tapi mudah dipindai.
- Status update tidak banyak langkah.

### 3.3 ADMIN

Admin mengelola sistem, knowledge base, analytics, dan audit chat.

Kebutuhan:

- CRUD knowledge base.
- Melihat analytics dan top issues.
- Melihat chat logs.
- Mengelola self-learning candidate.
- Mengakses ticket/helpdesk data saat diperlukan.
- Memastikan RAG memakai knowledge yang valid.

Prioritas UX:

- Panel operasional yang stabil.
- Form knowledge management jelas.
- Review candidate aman dan auditable.

## 4. Status Sistem Saat Ini

### 4.1 Struktur Repository

```txt
aiHelpdeskEpson/
  backend/
    prisma/
      migrations/
      schema.prisma
      seed.js
      backfill-embeddings.js
      sql/enable_pgvector.sql
    src/
      config/
      middlewares/
      modules/
      utils/
      app.js
      server.js
    API.md
    DEMO.md
    RAG_GEMINI.md
    README.md
  frontend/
    src/
      modules/
      services/
      stores/
      router/
    README.md
  BACKEND_AI_RAG.md
  PRD.md
  README.md
```

### 4.2 Backend Saat Ini

Backend memakai:

- Node.js
- Express 5
- Prisma 7
- PostgreSQL
- pgvector
- JWT
- bcrypt
- multer
- nodemailer
- swagger-ui-express
- Gemini API untuk generation dan embedding

Pola struktur backend:

```txt
route -> middleware -> controller -> service -> prisma/database
```

Project ini bukan MVC klasik dengan satu folder global `controllers`. Project ini memakai modular route-controller-service. Controller ditempatkan di dalam setiap module, misalnya:

```txt
backend/src/modules/chat/chat.routes.js
backend/src/modules/chat/chat.controller.js
backend/src/modules/chat/chat.service.js
```

Ini sudah benar untuk aplikasi modular karena setiap domain memiliki route, controller, dan service sendiri.

### 4.3 Frontend Saat Ini

Frontend memakai:

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- Font Awesome
- Inter font package

Route yang terdeteksi saat dokumen ini dibuat:

```txt
/              -> LoginView
/dashboard     -> UserDashboardView
/chat          -> ChatView
/faq           -> UserFaqView
/tickets       -> UserTicketsView
```

Service frontend yang ada:

```txt
frontend/src/services/api.js
frontend/src/services/auth.service.js
frontend/src/services/chat.service.js
frontend/src/services/dashboard.service.js
frontend/src/services/knowledge.service.js
frontend/src/services/ticket.service.js
frontend/src/services/upload.service.js
```

Catatan penting:

- `frontend/src/services/api.js` masih hardcoded ke `http://localhost:4000/api`.
- Rekomendasi: ganti ke `import.meta.env.VITE_API_URL || "http://localhost:4000/api"`.
- Frontend FAQ memanggil `GET /api/knowledge`, tetapi backend saat ini belum mount `/api/knowledge`.

### 4.4 OpenAPI Saat Ini

Backend sudah menyediakan:

```txt
GET /api/docs
GET /api/docs.json
```

Catatan sinkronisasi:

- OpenAPI sudah mencakup banyak endpoint inti.
- Perlu menambahkan `GET /api/tickets/my`.
- Perlu menambahkan endpoint user-facing `GET /api/knowledge` setelah dibuat.
- Field `ticketNumber` dan `ticketCode` harus berada pada schema `EscalationTicket`, bukan `ChatMessage`.
- Endpoint target seperti delete chat, edit chat, temporary mode, preferences, dan learning candidates belum tersedia di backend maupun OpenAPI.

## 5. Arsitektur Sistem

### 5.1 Diagram Tingkat Tinggi

```txt
Browser Vue App
  |
  | Axios + Bearer JWT
  v
Express API
  |
  | Prisma Client
  v
PostgreSQL + pgvector
  |
  | vector similarity search
  v
KnowledgeChunk embeddings

Express AI/RAG module
  |
  | Gemini generation + embedding
  v
Gemini API

Express Reports module
  |
  | SMTP
  v
Mailpit / SMTP provider
```

### 5.2 Request Flow Login

```txt
Login form
  -> POST /api/auth/login
  -> backend validasi employeeId/password
  -> backend return user + token
  -> frontend simpan token
  -> request berikutnya membawa Authorization: Bearer <token>
```

### 5.3 Request Flow Chat RAG

```txt
User mengirim message
  -> POST /api/chat/message
  -> backend validasi auth dan payload
  -> buat atau ambil ChatSession
  -> simpan ChatMessage USER
  -> RAG search relevant KnowledgeChunk
  -> Gemini generate answer dengan context
  -> fallback mock/keyword jika Gemini/embedding tidak tersedia
  -> simpan ChatMessage AI
  -> return session, userMessage, aiMessage, contexts, provider
```

### 5.4 Request Flow Ticket Escalation

```txt
User klik Escalate
  -> POST /api/tickets/escalate
  -> backend validasi session milik user
  -> backend build summary dari conversation
  -> backend create EscalationTicket
  -> backend update ChatSession status ESCALATED
  -> frontend tampilkan ticketCode dan status
```

### 5.5 Request Flow Knowledge Update

```txt
Admin create/update KnowledgeDocument
  -> backend simpan document
  -> backend pecah content menjadi KnowledgeChunk
  -> backend generate embedding untuk chunk
  -> embedding disimpan di pgvector
  -> chat berikutnya dapat retrieve chunk tersebut
```

### 5.6 Request Flow Mailpit, Backend, dan Frontend

Mailpit dipakai sebagai SMTP inbox lokal agar fitur email dapat diuji end-to-end tanpa mengirim email sungguhan ke luar environment development.

Alur integrasi:

```txt
Frontend Helpdesk/Admin
  -> user membuka ticket detail atau report page
  -> user klik Generate Summary
  -> POST /api/reports/summary
  -> backend membuat summary dari ticket/session
  -> frontend menampilkan preview summary dan attachment

Frontend Helpdesk/Admin
  -> user mengisi recipientEmail dan subject
  -> user klik Send Email
  -> POST /api/reports/send-email
  -> backend mengirim email via nodemailer
  -> nodemailer memakai SMTP_HOST=localhost dan SMTP_PORT=1025
  -> Mailpit menangkap email
  -> backend membuat EmailLog SENT atau FAILED
  -> frontend menampilkan status pengiriman

Frontend Helpdesk/Admin
  -> user membuka Email Logs
  -> GET /api/email-logs
  -> backend mengambil EmailLog dari database
  -> frontend menampilkan riwayat email

Developer/QA
  -> buka http://localhost:8025
  -> verifikasi isi email dan attachment di Mailpit
```

Integrasi ini berarti ada 3 sumber kebenaran yang saling melengkapi:

| Layer | Tanggung jawab |
|---|---|
| Frontend | Trigger generate summary, preview email, kirim email, dan tampilkan email logs. |
| Backend | Validasi auth/role, ambil ticket/session, build summary, kirim via SMTP, simpan EmailLog. |
| Mailpit | Menangkap email development agar QA bisa melihat subject, body, dan attachment. |

Untuk production, Mailpit diganti SMTP provider perusahaan. Kontrak frontend dan backend tetap sama; yang berubah hanya konfigurasi `.env` backend.

## 6. Backend Documentation

### 6.1 Entry Point Backend

File utama:

```txt
backend/src/server.js
backend/src/app.js
```

`app.js` bertanggung jawab untuk:

- Inisialisasi Express.
- Security middleware `helmet`.
- CORS.
- JSON parser.
- URL encoded parser.
- Request logging `morgan`.
- Swagger UI.
- Mount route publik.
- Mount route protected setelah `requireAuth`.
- Error handler dan not found handler.

Route publik:

```txt
GET /api/docs
GET /api/docs.json
GET /api/health
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

Catatan:

- `/api/auth/logout` dan `/api/auth/me` memasang `requireAuth` di dalam `auth.routes.js`.
- Setelah `app.use("/api", requireAuth)`, route berikutnya wajib memakai JWT.

Route protected:

```txt
/api/dashboard
/api/chat
/api/files
/api/tickets
/api/reports
/api/email-logs
/api/admin/knowledge
/api/admin
```

### 6.2 Middleware Backend

Middleware penting:

```txt
backend/src/middlewares/auth.middleware.js
backend/src/middlewares/role.middleware.js
backend/src/middlewares/error.middleware.js
backend/src/middlewares/notfound.middleware.js
```

Tanggung jawab:

- `requireAuth`: validasi Bearer JWT dan isi `req.user`.
- `authorizeRoles`: batasi akses berdasarkan role.
- `errorHandler`: normalisasi error API.
- `notFound`: response saat route tidak ditemukan.

### 6.3 Config Backend

File config:

```txt
backend/src/config/env.js
backend/src/config/prisma.js
backend/src/config/ai.js
backend/src/config/openapi.js
```

Tanggung jawab:

- `env.js`: membaca environment variable.
- `prisma.js`: membuat Prisma client.
- `ai.js`: konfigurasi Gemini/RAG.
- `openapi.js`: spesifikasi OpenAPI.

### 6.4 Database Model

Model utama dari Prisma:

```txt
User
IssueCategory
ChatSession
ChatMessage
UploadedFile
KnowledgeDocument
KnowledgeChunk
SuggestedQuestion
EscalationTicket
EmailLog
```

Enum utama:

```txt
UserRole: USER, ADMIN, HELPDESK
ChatSessionStatus: ACTIVE, RESOLVED, ESCALATED
MessageSender: USER, AI, SYSTEM
TicketStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED
TicketPriority: LOW, MEDIUM, HIGH
EmailStatus: SENT, FAILED
```

Relasi kunci:

- `User` memiliki banyak `ChatSession`, `UploadedFile`, dan `EscalationTicket`.
- `ChatSession` memiliki banyak `ChatMessage` dan `EscalationTicket`.
- `ChatMessage` dapat merujuk `UploadedFile`.
- `KnowledgeDocument` memiliki banyak `KnowledgeChunk` dan `SuggestedQuestion`.
- `KnowledgeChunk.embedding` memakai tipe `vector(768)` dari pgvector.
- `EscalationTicket` terhubung ke `ChatSession`, `User`, `IssueCategory`, dan `EmailLog`.

### 6.5 Endpoint Backend Saat Ini

Endpoint berikut adalah yang tersedia dari route backend saat dokumen ini dibuat.

| Area | Method | Endpoint | Role | Status |
|---|---|---|---|---|
| Docs | GET | `/api/docs` | Public | Ready |
| Docs | GET | `/api/docs.json` | Public | Ready |
| Health | GET | `/api/health` | Public | Ready |
| Auth | POST | `/api/auth/login` | Public | Ready |
| Auth | POST | `/api/auth/logout` | Authenticated | Ready |
| Auth | GET | `/api/auth/me` | Authenticated | Ready |
| Dashboard | GET | `/api/dashboard` | Authenticated | Ready |
| Dashboard | GET | `/api/dashboard/popular-issues` | Authenticated | Ready |
| Dashboard | GET | `/api/dashboard/recent-activity` | Authenticated | Ready |
| Chat | POST | `/api/chat/message` | Authenticated | Ready |
| Chat | GET | `/api/chat/history` | Authenticated | Ready |
| Chat | GET | `/api/chat/sessions/:id` | Authenticated | Ready |
| Files | POST | `/api/files/upload` | Authenticated | Ready |
| Files | GET | `/api/files/:id` | Authenticated | Ready |
| Files | DELETE | `/api/files/:id` | Authenticated | Ready |
| Tickets | POST | `/api/tickets/escalate` | USER, ADMIN, HELPDESK | Ready |
| Tickets | GET | `/api/tickets/my` | USER | Ready |
| Tickets | GET | `/api/tickets` | ADMIN, HELPDESK | Ready |
| Tickets | GET | `/api/tickets/:id` | ADMIN, HELPDESK | Ready |
| Tickets | PATCH | `/api/tickets/:id/status` | ADMIN, HELPDESK | Ready |
| Reports | POST | `/api/reports/summary` | Authenticated | Ready |
| Reports | POST | `/api/reports/send-email` | Authenticated | Ready |
| Email Logs | GET | `/api/email-logs` | ADMIN, HELPDESK | Ready |
| Admin Knowledge | GET | `/api/admin/knowledge` | ADMIN | Ready |
| Admin Knowledge | POST | `/api/admin/knowledge` | ADMIN | Ready |
| Admin Knowledge | PUT | `/api/admin/knowledge/:id` | ADMIN | Ready |
| Admin Knowledge | DELETE | `/api/admin/knowledge/:id` | ADMIN | Ready |
| Admin | GET | `/api/admin/chat-logs` | ADMIN | Ready |
| Admin | GET | `/api/admin/chat-logs/:id` | ADMIN | Ready |
| Admin | GET | `/api/admin/analytics` | ADMIN | Ready |
| Admin | GET | `/api/admin/top-issues` | ADMIN | Ready |

### 6.6 Endpoint Gap yang Harus Ditambahkan

Gap paling penting:

| Area | Endpoint | Alasan |
|---|---|---|
| FAQ employee | `GET /api/knowledge` | Frontend FAQ sudah memanggil endpoint ini, tetapi backend belum mount. |
| FAQ detail | `GET /api/knowledge/:id` | Dibutuhkan jika FAQ punya halaman detail. |
| Suggested FAQ | `GET /api/knowledge/suggested-questions` | Dibutuhkan untuk quick prompts di chat/FAQ. |
| Ticket detail user | `GET /api/tickets/my/:id` | Agar employee bisa refresh detail ticket miliknya. |
| Chat rename | `PATCH /api/chat/sessions/:id` | Dibutuhkan untuk ChatGPT-style sidebar. |
| Chat delete | `DELETE /api/chat/sessions/:id` | Dibutuhkan untuk hapus riwayat chat. |
| Chat archive | `POST /api/chat/sessions/:id/archive` | Dibutuhkan untuk hide tanpa hard delete. |
| Message edit | `PATCH /api/chat/messages/:id` | Dibutuhkan untuk edit prompt user. |
| Regenerate | `POST /api/chat/messages/:id/regenerate` | Dibutuhkan untuk regenerate AI answer. |
| Feedback | `POST /api/chat/messages/:id/feedback` | Dibutuhkan untuk quality signal dan self-learning candidate. |
| Temporary mode | `POST /api/chat/message` dengan `temporary: true` | Dibutuhkan agar chat tidak tersimpan. |
| Preferences | `GET/PATCH /api/users/me/preferences` | Dibutuhkan untuk theme dan default mode. |
| Learning candidates | `/api/learning/candidates*` | Dibutuhkan untuk self-learning yang aman. |

### 6.7 Kontrak Endpoint Target

#### 6.7.1 User-facing Knowledge

Rekomendasi mount:

```txt
app.use("/api/knowledge", knowledgePublicRoutes)
```

Endpoint:

```txt
GET /api/knowledge
GET /api/knowledge/:id
GET /api/knowledge/suggested-questions
```

Role:

```txt
USER, HELPDESK, ADMIN
```

Response minimal `GET /api/knowledge`:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Print Quality Banding Troubleshooting",
      "source": "Internal SOP PQ-001",
      "content": "When banding appears...",
      "category": {
        "id": "uuid",
        "name": "Print Quality Issue"
      },
      "suggestedQuestions": [],
      "_count": {
        "chunks": 1
      },
      "updatedAt": "2026-06-05T00:00:00.000Z"
    }
  ]
}
```

#### 6.7.2 Chat Session Management

Endpoint target:

```txt
POST /api/chat/sessions
PATCH /api/chat/sessions/:id
DELETE /api/chat/sessions/:id
DELETE /api/chat/sessions
POST /api/chat/sessions/:id/archive
POST /api/chat/sessions/:id/restore
```

Payload rename:

```json
{
  "title": "Printer banding after maintenance"
}
```

Payload status/archive:

```json
{
  "status": "RESOLVED",
  "archived": true
}
```

Rules:

- USER hanya boleh mengubah session miliknya.
- ADMIN bisa melihat audit log sesuai policy.
- Delete sebaiknya soft delete jika data chat dibutuhkan untuk audit.
- History default tidak menampilkan archived/deleted.

#### 6.7.3 Chat Message Editing

Endpoint target:

```txt
PATCH /api/chat/messages/:id
DELETE /api/chat/messages/:id
POST /api/chat/messages/:id/regenerate
POST /api/chat/messages/:id/feedback
```

Payload edit:

```json
{
  "message": "Output printer muncul garis setelah maintenance. Apa langkah awal?"
}
```

Payload feedback:

```json
{
  "rating": "HELPFUL",
  "comment": "Jawaban sesuai SOP",
  "shouldCreateLearningCandidate": true
}
```

Rules:

- Hanya message `sender = USER` yang bisa diedit oleh user.
- Setelah edit, AI answer setelah message itu harus digenerate ulang.
- Simpan metadata `editedAt` dan versi lama jika audit dibutuhkan.
- Feedback negatif tidak otomatis menghapus knowledge.

#### 6.7.4 Temporary Mode

Keputusan PRD:

- Pakai payload `temporary: true` pada `POST /api/chat/message`.
- Jangan buat endpoint terpisah kecuali backend butuh boundary eksplisit.

Payload:

```json
{
  "message": "Cek error ini tanpa simpan riwayat",
  "imageId": null,
  "temporary": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "session": null,
    "userMessage": null,
    "aiMessage": {
      "sender": "AI",
      "messageText": "..."
    },
    "contexts": [],
    "provider": "gemini",
    "temporary": true
  }
}
```

Rules:

- Tidak tampil di `/api/chat/history`.
- Tidak dipakai self-learning.
- Tidak membuat ticket otomatis.
- Jika user ingin eskalasi dari temporary chat, tampilkan konfirmasi "save and escalate".
- Jika backend perlu menyimpan untuk debug, gunakan `isTemporary = true` dan TTL pendek.

#### 6.7.5 User Preferences

Endpoint target:

```txt
GET /api/users/me/preferences
PATCH /api/users/me/preferences
```

Payload:

```json
{
  "theme": "system",
  "defaultChatMode": "normal",
  "compactSidebar": false
}
```

Nilai `theme`:

```txt
light
dark
system
```

Fallback frontend:

- Jika endpoint belum ada, simpan theme di `localStorage`.

#### 6.7.6 Self-learning Candidates

Endpoint target:

```txt
POST /api/learning/candidates/from-session/:sessionId
GET /api/learning/candidates
GET /api/learning/candidates/:id
PATCH /api/learning/candidates/:id
POST /api/learning/candidates/:id/approve
POST /api/learning/candidates/:id/reject
```

Konsep:

```txt
Non-temporary chat
  -> feedback helpful / ticket resolved / admin mark valid
  -> backend membuat KnowledgeCandidate
  -> redaction data sensitif
  -> admin/helpdesk review
  -> approve menjadi KnowledgeDocument
  -> chunking + embedding
  -> RAG dapat memakai knowledge baru
```

Status:

```txt
PENDING
NEEDS_EDIT
APPROVED
REJECTED
```

Contoh object:

```json
{
  "id": "uuid",
  "sourceSessionId": "uuid",
  "createdByUserId": "uuid",
  "title": "Banding after maintenance troubleshooting",
  "content": "Validated troubleshooting steps...",
  "categoryId": "uuid",
  "status": "PENDING",
  "confidenceScore": 0.82,
  "redactionStatus": "REDACTED",
  "createdAt": "2026-06-05T00:00:00.000Z"
}
```

### 6.8 Backend Module Requirements

#### Auth Module

Current files:

```txt
backend/src/modules/auth/auth.routes.js
backend/src/modules/auth/auth.controller.js
backend/src/modules/auth/auth.service.js
```

Requirements:

- Login memakai `employeeId` dan `password`.
- Boleh menerima email sebagai alternatif hanya jika service memang mendukung.
- Response login harus berisi `user` dan `token`.
- Password disimpan sebagai bcrypt hash.
- Token JWT tidak disimpan server-side untuk MVP.

#### Dashboard Module

Current endpoints:

```txt
GET /api/dashboard
GET /api/dashboard/popular-issues
GET /api/dashboard/recent-activity
```

Requirements:

- Endpoint dashboard tidak perlu dipisah menjadi `/api/issues` dan `/api/activity`.
- Data dashboard harus berdasarkan user saat role USER.
- Admin/helpdesk boleh mendapat data agregat jika service mendukung.

#### Chat Module

Current endpoints:

```txt
POST /api/chat/message
GET /api/chat/history
GET /api/chat/sessions/:id
```

Current behavior:

- Membuat session otomatis jika `sessionId` kosong.
- Menyimpan message user.
- Melakukan RAG retrieval.
- Generate jawaban AI.
- Menyimpan message AI.
- Menghitung confidence score.
- USER hanya boleh membuka session miliknya.

Target behavior:

- Tambah temporary mode.
- Tambah lifecycle session.
- Tambah edit/regenerate/feedback.
- Tambah exclusion temporary dari history/self-learning.

#### Files Module

Current endpoints:

```txt
POST /api/files/upload
GET /api/files/:id
DELETE /api/files/:id
```

Requirements:

- Hanya file image yang diterima: JPEG, PNG, WEBP.
- Max 5MB.
- USER hanya boleh memakai file miliknya sendiri.
- Upload dapat dipakai di chat melalui `imageId`.

#### Tickets Module

Current endpoints:

```txt
POST /api/tickets/escalate
GET /api/tickets/my
GET /api/tickets
GET /api/tickets/:id
PATCH /api/tickets/:id/status
```

Current behavior:

- Ticket punya `ticketNumber`.
- Service menambahkan `ticketCode` seperti `TKT-001`.
- `GET /api/tickets/my` khusus USER.
- `GET /api/tickets` dan detail khusus ADMIN/HELPDESK.
- Update status ke `RESOLVED` atau `CLOSED` ikut mengubah chat session menjadi `RESOLVED`.

Target behavior:

- Tambah `GET /api/tickets/my/:id`.
- Tambah search query `q`.
- Tambah update priority.
- Tambah assign ticket.
- Tambah comments jika helpdesk workflow butuh catatan.

#### Knowledge Module

Current mount:

```txt
/api/admin/knowledge
```

Current endpoints:

```txt
GET /api/admin/knowledge
POST /api/admin/knowledge
PUT /api/admin/knowledge/:id
DELETE /api/admin/knowledge/:id
```

Problem:

- Frontend FAQ memanggil `/api/knowledge`.
- Backend belum mount `/api/knowledge`.

Target:

- Tambah route read-only `/api/knowledge`.
- Tetap gunakan `/api/admin/knowledge` untuk CRUD admin.

#### Reports dan Email Module

Current endpoints:

```txt
POST /api/reports/summary
POST /api/reports/send-email
GET /api/email-logs
```

Requirements:

- Summary dapat dibuat dari `sessionId` atau `ticketId`.
- Send email mencatat `EmailLog`.
- Development memakai Mailpit.
- Production memakai SMTP perusahaan.

#### Admin Module

Current endpoints:

```txt
GET /api/admin/chat-logs
GET /api/admin/chat-logs/:id
GET /api/admin/analytics
GET /api/admin/top-issues
```

Requirements:

- Hanya ADMIN.
- Chat logs mendukung pagination/filter.
- Analytics tidak boleh menampilkan data sensitif berlebihan.

## 7. Frontend Documentation

### 7.1 Frontend Entry Point

File penting:

```txt
frontend/src/main.js
frontend/src/App.vue
frontend/src/router/index.js
frontend/src/services/api.js
```

### 7.2 Routing Saat Ini

```txt
/              Login
/dashboard     Dashboard user
/chat          Chat AI
/faq           FAQ user
/tickets       My tickets user
```

### 7.3 Routing Target

USER:

```txt
/login
/chat
/chat/:sessionId
/chat/temp
/dashboard
/faq
/tickets
/tickets/:id
```

HELPDESK:

```txt
/helpdesk/tickets
/helpdesk/tickets/:id
/helpdesk/reports
/helpdesk/email-logs
```

ADMIN:

```txt
/admin
/admin/analytics
/admin/chat-logs
/admin/chat-logs/:id
/admin/knowledge
/admin/learning-candidates
/admin/top-issues
```

Keputusan:

- Default setelah login USER sebaiknya `/chat`.
- Dashboard tetap ada sebagai overview, bukan halaman utama.
- Route guard harus berdasarkan token dan role.

### 7.4 API Client

Current:

```js
const api = axios.create({
  baseURL: "http://localhost:4000/api",
});
```

Target:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});
```

Requirements:

- Request interceptor menambahkan Bearer token.
- Response interceptor menangani `401`.
- Error dinormalisasi agar UI konsisten.
- Jangan hardcode production API URL.

### 7.5 Frontend Service Sync

| Service | Current call | Backend status | Action |
|---|---|---|---|
| `auth.service.js` | `POST /auth/login` | Ready | Keep |
| `chat.service.js` | `POST /chat/message` | Ready | Extend for temporary |
| `chat.service.js` | `GET /chat/history` | Ready | Keep |
| `chat.service.js` | `GET /chat/sessions/:id` | Ready | Keep |
| `dashboard.service.js` | `GET /dashboard` | Ready | Keep |
| `dashboard.service.js` | `GET /dashboard/popular-issues` | Ready | Keep |
| `dashboard.service.js` | `GET /dashboard/recent-activity` | Ready | Keep |
| `knowledge.service.js` | `GET /knowledge` | Missing backend mount | Add backend endpoint |
| `ticket.service.js` | `GET /tickets/my` | Ready | Keep |
| `ticket.service.js` | `POST /tickets/escalate` | Ready | Keep |
| `upload.service.js` | `POST /files/upload` | Ready | Keep |
| `report.service.js` | `POST /reports/summary` | Ready backend, missing frontend service | Add frontend service |
| `report.service.js` | `POST /reports/send-email` | Ready backend, missing frontend service | Add frontend service |
| `emailLog.service.js` | `GET /email-logs` | Ready backend, missing frontend service | Add frontend service for HELPDESK/ADMIN |

### 7.6 ChatGPT-style Shell

Target layout:

```txt
AppShell
  Sidebar
    New chat
    Temporary mode toggle
    Chat history
    Dashboard
    FAQ
    My Tickets
    Helpdesk/Admin links by role
    Theme toggle
    User menu/logout
  Main
    Current page content
    Chat thread for /chat
  Composer
    Textarea
    Upload image
    Send
    Escalate
```

Desktop:

```txt
sidebar width: 280px
composer max width: 760px - 860px
main content: fluid
```

Mobile:

```txt
sidebar becomes drawer
top bar has menu, title, profile
composer sticky bottom
message width full
```

### 7.7 Visual Design Requirements

Style direction:

- Clean.
- Operational.
- Chat-first.
- Neutral base color.
- Epson blue as accent.
- No marketing hero.
- No decorative blobs/orbs.
- No nested cards.
- Cards only for repeated items, modals, or tool panels.
- Border radius max 8px unless existing system requires otherwise.
- Icons for action buttons when clear.
- Text must not overflow button, card, table, or sidebar.

Theme:

```txt
light
dark
system
```

Suggested tokens:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f7f7f8;
  --color-surface-strong: #ececf1;
  --color-border: #d9d9e3;
  --color-text: #202123;
  --color-muted: #6e6e80;
  --color-primary: #0b63ce;
  --color-primary-strong: #084da1;
  --color-success: #087443;
  --color-warning: #a15c07;
  --color-danger: #b42318;
  --radius-sm: 6px;
  --radius-md: 8px;
  --sidebar-width: 280px;
  --composer-width: 860px;
}

[data-theme="dark"] {
  --color-bg: #202123;
  --color-surface: #2a2b32;
  --color-surface-strong: #343541;
  --color-border: #4e4f60;
  --color-text: #f7f7f8;
  --color-muted: #c5c5d2;
  --color-primary: #4f9cff;
  --color-primary-strong: #7bb7ff;
}
```

### 7.8 Component Plan

Core:

```txt
AppShell.vue
SidebarNav.vue
TopBar.vue
MobileDrawer.vue
ThemeToggle.vue
UserMenu.vue
RoleGuard.vue
```

Chat:

```txt
ChatLayout.vue
ChatSidebar.vue
ChatThreadList.vue
ChatMessageList.vue
ChatMessage.vue
ChatComposer.vue
ImageAttachmentPreview.vue
RelatedContextPanel.vue
EscalateModal.vue
TicketSuccessModal.vue
TemporaryModeToggle.vue
ChatItemMenu.vue
EditMessageForm.vue
FeedbackActions.vue
```

FAQ:

```txt
FaqSearchBar.vue
FaqCategoryFilter.vue
FaqAccordion.vue
FaqEmptyState.vue
```

Tickets:

```txt
TicketList.vue
TicketListItem.vue
TicketStatusBadge.vue
TicketPriorityBadge.vue
TicketDetailPanel.vue
TicketStatusControl.vue
TicketFilterBar.vue
```

Admin:

```txt
AdminMetricCard.vue
AdminTable.vue
KnowledgeEditor.vue
KnowledgeList.vue
ChatLogDetail.vue
LearningCandidateList.vue
LearningCandidateReview.vue
```

### 7.9 Pinia Store Plan

Current stores include auth and knowledge. Target stores:

```txt
auth.store.js
chat.store.js
dashboard.store.js
knowledge.store.js
ticket.store.js
preferences.store.js
learning.store.js
```

Responsibilities:

| Store | Responsibility |
|---|---|
| `auth.store` | user, token, role, login, logout, me |
| `chat.store` | current session, messages, history, send, temporary mode, rename/delete/edit/regenerate |
| `dashboard.store` | overview, popular issues, recent activity |
| `knowledge.store` | FAQ list, categories, search/filter state |
| `ticket.store` | my tickets, helpdesk queue, selected ticket, status update |
| `preferences.store` | theme, compact sidebar, default chat mode |
| `learning.store` | candidate list, candidate detail, approve/reject |

### 7.10 Frontend Error Handling

Rules:

- `401`: clear token, redirect login.
- `403`: show forbidden state.
- `404`: show not found state.
- `422/400`: show validation error near form.
- Network error: show retry.
- Chat AI error: keep user message visible and allow retry.
- Upload error: preserve typed message and show upload error.

## 8. AI RAG Documentation

### 8.1 Tujuan AI

AI tidak bertugas menjawab bebas tanpa batas. AI bertugas membantu troubleshooting berdasarkan knowledge internal, SOP, FAQ, dan context percakapan.

Target jawaban:

- Ringkas.
- Actionable.
- Grounded pada context.
- Memberi langkah troubleshooting.
- Menyebut eskalasi jika confidence rendah.
- Tidak mengarang SOP.

### 8.2 Struktur AI Module

AI/RAG berada di:

```txt
backend/src/modules/ai/
  ai.service.js
  rag.service.js
  retrieval.service.js
  embedding.service.js
  generation.service.js
  prompt.service.js
  providers/gemini.provider.js
```

Tanggung jawab:

| File | Tanggung jawab |
|---|---|
| `embedding.service.js` | Generate embedding query/document dan validasi dimensi |
| `retrieval.service.js` | Semantic search pgvector dan fallback keyword/recent |
| `generation.service.js` | Generate jawaban dengan Gemini atau fallback mock |
| `prompt.service.js` | Membuat prompt grounded dari context |
| `gemini.provider.js` | Integrasi REST Gemini, timeout, retry, safety settings |
| `rag.service.js` | Boundary RAG untuk search dan answer |

### 8.3 RAG Flow

```txt
KnowledgeDocument
  -> chunking
  -> KnowledgeChunk
  -> Gemini embedding RETRIEVAL_DOCUMENT
  -> pgvector storage

User question
  -> Gemini embedding RETRIEVAL_QUERY
  -> pgvector cosine similarity
  -> retrieve relevant chunks
  -> prompt with context
  -> Gemini answer
  -> fallback if needed
```

### 8.4 Retrieval Strategy

Prioritas retrieval:

1. Semantic search via pgvector jika embedding tersedia.
2. Keyword/full-text fallback jika semantic gagal.
3. Recent chunks fallback jika tidak ada result relevan.

Config penting:

```env
GEMINI_EMBEDDING_DIM=768
RAG_MIN_SIMILARITY=0.25
```

Catatan:

- Jika dimensi embedding berubah, migration vector dan semua embedding lama harus dibuat ulang.
- `KnowledgeChunk.embedding` memakai `vector(768)`.
- HNSW index dipakai untuk mempercepat similarity search.

### 8.5 Generation Strategy

Gemini digunakan untuk generate jawaban berdasarkan prompt yang sudah diberi context RAG.

Config:

```env
GEMINI_MODEL=gemini-2.0-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=700
GEMINI_TIMEOUT_MS=15000
GEMINI_MAX_RETRIES=1
GEMINI_SAFETY_THRESHOLD=BLOCK_MEDIUM_AND_ABOVE
```

Rules:

- Jawaban harus berdasarkan context jika context tersedia.
- Jika context tidak cukup, AI harus menyarankan langkah umum yang aman dan eskalasi.
- Jika Gemini gagal atau API key kosong, backend fallback ke mock response.
- Provider response mengembalikan `gemini` atau `mock`.

### 8.6 Confidence Score

Current service menghitung confidence berdasarkan:

- Top retrieval score.
- Provider boost jika Gemini berhasil.
- Apakah contexts tersedia.

Interpretasi UI:

```txt
>= 0.75   high confidence
0.60-0.74 medium confidence
< 0.60    low confidence, show escalation suggestion
```

UI tidak perlu menonjolkan angka confidence ke employee jika tidak membantu. Lebih baik tampilkan:

- "Likely match"
- "Needs verification"
- "Consider escalation"

### 8.7 Image Support

Current chat dapat mengirim `imageId`.

Flow:

```txt
POST /api/files/upload
  -> return UploadedFile id
POST /api/chat/message with imageId
  -> backend mengambil storagePath
  -> generation service dapat memakai imagePath jika provider mendukung
```

Requirements:

- Composer menampilkan image preview.
- User dapat menghapus attachment sebelum send.
- Jika upload sukses tapi chat gagal, image tetap dapat dipakai retry.
- Jika image tidak milik user, backend return 403.

### 8.8 Self-learning yang Aman

Definisi:

Self-learning di project ini bukan fine-tuning otomatis. Self-learning berarti sistem dapat membuat kandidat knowledge dari chat non-temporary yang tervalidasi.

Allowed source:

- Chat non-temporary.
- Chat dengan feedback helpful.
- Ticket yang sudah resolved.
- Session yang ditandai valid oleh admin/helpdesk.

Forbidden source:

- Temporary chat.
- Chat dengan data sensitif belum direduksi.
- Chat dengan feedback wrong/unsafe.
- Chat yang belum direview jika akan masuk knowledge base.

Pipeline:

```txt
Eligible chat
  -> summarize candidate
  -> redact sensitive data
  -> save KnowledgeCandidate PENDING
  -> admin/helpdesk review
  -> approve
  -> create KnowledgeDocument
  -> chunk + embedding
  -> available for RAG
```

### 8.9 AI Observability

Data yang sebaiknya dicatat:

- provider
- responseTimeMs
- confidenceScore
- retrievalMode
- retrieved document ids
- feedback rating
- fallback reason jika Gemini gagal
- whether temporary mode was used

Data yang tidak boleh dicatat tanpa alasan:

- Secret.
- Password.
- Token.
- Data sensitif employee yang tidak relevan.

## 9. Feature Requirements

### 9.1 Authentication

Backend:

```txt
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

Frontend:

- Login form berisi `employeeId` dan `password`.
- Loading state saat submit.
- Error message jika credential salah.
- Token disimpan localStorage untuk MVP.
- Route guard memvalidasi token.
- Logout menghapus token.

Acceptance criteria:

- Demo user bisa login dengan seed account.
- Protected endpoint membawa Bearer token.
- User tanpa token diarahkan ke login.

### 9.2 Chat

Backend current:

```txt
POST /api/chat/message
GET /api/chat/history
GET /api/chat/sessions/:id
```

Frontend requirements:

- Chat menjadi halaman utama USER.
- New chat tersedia di sidebar.
- User dapat membuka history.
- User dapat mengirim pesan teks.
- User dapat upload gambar.
- Related contexts dapat ditampilkan collapsible.
- Low confidence memunculkan action eskalasi.
- Loading AI response jelas.
- Error response tidak menghilangkan input user.

Acceptance criteria:

- Message terkirim dan AI response tampil.
- Session baru muncul di history.
- Session lama bisa dibuka ulang.
- Upload gambar bisa ikut chat.

### 9.3 Temporary Mode

Backend target:

```txt
POST /api/chat/message
body: { "temporary": true }
```

Frontend requirements:

- Toggle temporary tersedia di sidebar atau composer.
- Badge `Temporary` muncul di chat.
- Temporary chat tidak muncul di history.
- Refresh menghapus temporary thread dari UI.
- Tidak ada self-learning candidate dari temporary chat.
- Eskalasi temporary harus meminta konfirmasi save.

Acceptance criteria:

- Temporary message mendapat AI answer.
- History tidak berubah.
- Tidak ada ticket/candidate otomatis.

### 9.4 Chat Lifecycle

Backend target:

```txt
PATCH /api/chat/sessions/:id
DELETE /api/chat/sessions/:id
POST /api/chat/sessions/:id/archive
POST /api/chat/sessions/:id/restore
PATCH /api/chat/messages/:id
POST /api/chat/messages/:id/regenerate
POST /api/chat/messages/:id/feedback
```

Frontend requirements:

- Sidebar item memiliki menu rename, archive, delete.
- Delete memakai confirmation modal.
- User message bisa diedit.
- AI answer bisa regenerated.
- Feedback helpful/not helpful tersedia.

Acceptance criteria:

- USER hanya bisa manage chat miliknya.
- Rename langsung tercermin di sidebar.
- Delete menghapus item dari history UI.
- Edit message menghasilkan answer baru.

### 9.5 FAQ / Knowledge

Backend current:

```txt
/api/admin/knowledge
```

Backend target:

```txt
GET /api/knowledge
GET /api/knowledge/:id
GET /api/knowledge/suggested-questions
```

Frontend requirements:

- FAQ page membaca dari `/api/knowledge`.
- Search title/content.
- Filter category.
- Accordion/detail view.
- Related FAQ dari chat bisa membuka FAQ detail.

Acceptance criteria:

- `/faq` tidak error.
- USER tidak bisa CRUD knowledge.
- ADMIN CRUD tetap lewat `/api/admin/knowledge`.

### 9.6 Tickets

Backend current:

```txt
POST /api/tickets/escalate
GET /api/tickets/my
GET /api/tickets
GET /api/tickets/:id
PATCH /api/tickets/:id/status
```

Frontend USER:

- Create ticket dari chat.
- Lihat daftar ticket milik sendiri.
- Lihat `ticketCode`, status, priority, category, summary, createdAt.

Frontend HELPDESK:

- Lihat ticket queue.
- Filter status/priority/category.
- Update status.
- Lihat detail session terkait.

Frontend ADMIN:

- Semua kebutuhan helpdesk.
- Analytics terkait ticket.

Acceptance criteria:

- USER hanya melihat ticket miliknya.
- HELPDESK/ADMIN bisa melihat semua ticket.
- Update status berhasil dan UI refresh.

### 9.7 Dashboard

Backend:

```txt
GET /api/dashboard
GET /api/dashboard/popular-issues
GET /api/dashboard/recent-activity
```

Frontend requirements:

- Dashboard ringkas.
- Link ke new chat, FAQ, my tickets.
- Popular issues dari backend.
- Recent activity membuka session jika ada id.

Acceptance criteria:

- Dashboard tidak menjadi landing marketing.
- Semua shortcut menuju route benar.

### 9.8 Reports dan Email

Backend:

```txt
POST /api/reports/summary
POST /api/reports/send-email
GET /api/email-logs
```

Requirements:

- Helpdesk/admin dapat membuat summary dari ticket/session.
- Email dikirim ke recipient.
- Email logs dapat difilter status.
- Mailpit dipakai untuk development.
- Frontend menyediakan UI generate summary pada ticket detail atau report page.
- Frontend menampilkan preview summary sebelum email dikirim.
- Frontend mengirim payload `ticketId` atau `sessionId`, `recipientEmail`, dan optional `subject`.
- Frontend menampilkan attachment yang akan ikut terkirim, terutama image defect dari chat.
- Backend memakai konfigurasi SMTP dari `.env`.
- Backend development diarahkan ke Mailpit dengan `SMTP_HOST=localhost` dan `SMTP_PORT=1025`.
- Backend wajib menyimpan `EmailLog` dengan status `SENT` atau `FAILED`.
- Frontend HELPDESK/ADMIN menyediakan halaman atau panel Email Logs dari `GET /api/email-logs`.
- QA dapat membuka Mailpit di `http://localhost:8025` untuk verifikasi email.

Frontend service target:

```txt
frontend/src/services/report.service.js
frontend/src/services/email-log.service.js
```

Kontrak service:

```js
export const ReportService = {
  generateSummary(payload) {
    return api.post("/reports/summary", payload);
  },
  sendEmail(payload) {
    return api.post("/reports/send-email", payload);
  },
};

export const EmailLogService = {
  list(params) {
    return api.get("/email-logs", { params });
  },
};
```

Payload generate summary:

```json
{
  "ticketId": "uuid"
}
```

Atau:

```json
{
  "sessionId": "uuid"
}
```

Payload send email:

```json
{
  "ticketId": "uuid",
  "recipientEmail": "helpdesk@epson.local",
  "subject": "Epson AI Helpdesk - Ticket Summary"
}
```

Expected response send email:

```json
{
  "success": true,
  "data": {
    "sent": true,
    "emailLog": {
      "id": "uuid",
      "ticketId": "uuid",
      "recipientEmail": "helpdesk@epson.local",
      "subject": "Epson AI Helpdesk - Ticket Summary",
      "status": "SENT",
      "sentAt": "2026-06-05T00:00:00.000Z"
    },
    "summary": "Conversation summary...",
    "attachments": [
      {
        "filename": "defect.png",
        "contentType": "image/png"
      }
    ]
  }
}
```

UI flow:

```txt
Ticket Detail
  -> Generate Summary
  -> Summary Preview Modal/Panel
  -> Recipient Email + Subject
  -> Send Email
  -> Toast success/failed
  -> Email log list updates
  -> QA opens Mailpit inbox
```

Acceptance criteria:

- Summary berhasil dibuat.
- Email log tercatat SENT atau FAILED.
- Development email muncul di Mailpit.
- Frontend dapat mengirim email tanpa membuka Postman/Swagger.
- Frontend menampilkan error jika Mailpit/backend SMTP tidak aktif.
- Attachment image defect muncul di Mailpit saat ticket/session memiliki uploaded image.
- HELPDESK/ADMIN dapat melihat email log dari frontend.

### 9.9 Admin Knowledge Management

Backend:

```txt
GET /api/admin/knowledge
POST /api/admin/knowledge
PUT /api/admin/knowledge/:id
DELETE /api/admin/knowledge/:id
```

Frontend requirements:

- List knowledge.
- Create/edit form.
- Delete confirmation.
- Show category, source, updatedAt.
- Show embedding/backfill status jika backend menyediakan.

Acceptance criteria:

- Admin dapat CRUD knowledge.
- Knowledge approved muncul di user FAQ.
- Knowledge baru bisa dipakai RAG setelah embedding.

### 9.10 Learning Candidate Review

Backend target:

```txt
GET /api/learning/candidates
GET /api/learning/candidates/:id
PATCH /api/learning/candidates/:id
POST /api/learning/candidates/:id/approve
POST /api/learning/candidates/:id/reject
```

Frontend requirements:

- Admin/helpdesk melihat queue candidates.
- Detail candidate menampilkan source session.
- Editor untuk title/content/category.
- Approve membuat knowledge.
- Reject membutuhkan alasan.

Acceptance criteria:

- Candidate temporary tidak pernah muncul.
- Approved candidate menjadi knowledge document.
- Rejected candidate tidak dipakai RAG.

### 9.11 Theme Mode

Requirements:

- Light, dark, system.
- Default `system`.
- Persist di localStorage sampai endpoint preferences tersedia.
- Semua halaman harus readable.
- Status badge harus kontras di light dan dark.

Acceptance criteria:

- Theme bertahan setelah refresh.
- System mode mengikuti OS/browser.
- Tidak ada teks yang hilang karena kontras rendah.

## 10. Security dan Privacy

Rules:

- Jangan commit `.env`.
- Jangan expose JWT di URL.
- Jangan simpan password plain text.
- Semua protected endpoint harus melewati `requireAuth`.
- Role ADMIN/HELPDESK/USER harus diterapkan di route sensitif.
- USER hanya boleh melihat resource miliknya.
- Temporary chat tidak boleh masuk history normal.
- Self-learning harus melewati redaction dan review.
- Uploaded file harus divalidasi mime type dan size.
- Error response tidak boleh membocorkan stack trace di production.

## 11. Environment dan Setup

### 11.1 Backend Environment

Contoh:

```env
PORT=4000
DATABASE_URL="postgresql://postgres:change-me-postgres@localhost:5432/epson_helpdesk"
JWT_SECRET=change-me-long-secret

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIM=768
GEMINI_TIMEOUT_MS=15000
GEMINI_MAX_RETRIES=1
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=700
GEMINI_SAFETY_THRESHOLD=BLOCK_MEDIUM_AND_ABOVE
RAG_MIN_SIMILARITY=0.25
AI_MIN_RESPONSE_MS=900

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=helpdesk@epson.local

CORS_ORIGIN=http://localhost:5173
```

### 11.2 Frontend Environment

```env
VITE_API_URL=http://localhost:4000/api
```

### 11.3 Backend Commands

```bash
cd backend
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run rag:backfill
npm run dev
```

### 11.4 Frontend Commands

```bash
cd frontend
npm install
npm run dev
```

### 11.5 Reset Database Local

```bash
cd backend
npx prisma migrate reset --force
npm run rag:backfill
```

Catatan:

- Reset menghapus chat, upload metadata, ticket, email log, dan data lain di database target.
- Jalankan hanya pada database local/development.

## 12. README Requirements

README root harus menjadi pintu masuk proyek dan wajib memuat:

- Ringkasan aplikasi.
- Tech stack backend/frontend/AI.
- Struktur repository.
- Cara setup backend.
- Cara setup frontend.
- Environment variable yang dibutuhkan tanpa secret asli.
- Cara menjalankan database dan Mailpit.
- Cara menjalankan migration, seed, dan backfill RAG.
- URL penting:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:4000`
  - Swagger: `http://localhost:4000/api/docs`
  - Mailpit: `http://localhost:8025`
- Demo account.
- Endpoint penting.
- Known gaps antara frontend dan backend.
- Link ke dokumen detail:
  - `PRD.md`
  - `BACKEND_AI_RAG.md`
  - `backend/README.md`
  - `backend/API.md`
  - `backend/RAG_GEMINI.md`
  - `frontend/README.md`

README backend boleh tetap lebih teknis untuk API dan database. README frontend boleh fokus ke cara menjalankan UI. README root harus menyatukan keduanya.

## 13. OpenAPI Requirements

OpenAPI harus menjadi kontrak resmi API.

Wajib tersedia:

```txt
GET /api/docs
GET /api/docs.json
```

Perlu update:

- Tambah `/tickets/my`.
- Tambah `/knowledge` setelah endpoint dibuat.
- Pindahkan `ticketNumber` dan `ticketCode` ke schema `EscalationTicket`.
- Tambah endpoint chat lifecycle.
- Tambah temporary mode field pada request/response `/chat/message`.
- Tambah user preferences.
- Tambah learning candidates.
- Tambah contoh response error standar.

Definition of done:

- Semua endpoint yang dipanggil frontend ada di OpenAPI.
- Semua endpoint di OpenAPI benar-benar ada di route backend.
- Swagger bisa dipakai login dan authorize Bearer token.

## 14. Roadmap Implementasi

### Phase 1 - API Alignment

- Tambah `GET /api/knowledge`.
- Tambah OpenAPI untuk `/tickets/my`.
- Perbaiki schema `EscalationTicket` di OpenAPI.
- Update frontend `api.js` agar memakai `VITE_API_URL`.
- Tambah route guard dasar.

### Phase 2 - ChatGPT-style Shell

- Buat `AppShell`.
- Buat sidebar responsive.
- Pindahkan navigasi utama ke sidebar.
- Default USER ke `/chat`.
- Tambah theme localStorage.

### Phase 3 - Chat Core

- Rebuild chat page.
- Integrasi history.
- Integrasi upload image.
- Integrasi escalation modal.
- Tampilkan related contexts.
- Tampilkan confidence state.

### Phase 4 - Chat Advanced

- Tambah temporary mode backend dan frontend.
- Tambah rename/delete/archive chat.
- Tambah edit message.
- Tambah regenerate answer.
- Tambah feedback.

### Phase 5 - FAQ dan Tickets

- Rebuild FAQ.
- Tambah backend `/api/knowledge`.
- Rebuild My Tickets.
- Tambah ticket detail.
- Tambah helpdesk ticket queue.
- Tambah report summary dan send email dari ticket detail.
- Tambah email logs page/panel untuk HELPDESK/ADMIN.
- Verifikasi integrasi Mailpit dari frontend.

### Phase 6 - Admin dan Self-learning

- Rebuild admin knowledge.
- Tambah learning candidates backend.
- Tambah review queue frontend.
- Integrasi approve ke knowledge + embedding.
- Tambah analytics/chat logs UI.

### Phase 7 - QA dan Documentation

- Jalankan build frontend.
- Test backend endpoint via Swagger.
- Test role USER/HELPDESK/ADMIN.
- Test RAG fallback tanpa Gemini key.
- Test RAG semantic dengan Gemini key.
- Update README dan OpenAPI.

## 15. Testing Plan

### 15.1 Backend Testing Manual

Checklist:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/chat/message`
- `GET /api/chat/history`
- `GET /api/chat/sessions/:id`
- `POST /api/files/upload`
- `POST /api/tickets/escalate`
- `GET /api/tickets/my`
- `GET /api/tickets` sebagai HELPDESK/ADMIN
- `PATCH /api/tickets/:id/status`
- `GET /api/admin/knowledge` sebagai ADMIN
- `GET /api/docs`

### 15.2 Frontend Testing Manual

Checklist:

- Login USER.
- Redirect ke chat.
- Send chat tanpa image.
- Upload image dan send chat.
- Escalate ticket.
- Buka My Tickets.
- Buka FAQ.
- Login HELPDESK.
- Buka ticket queue.
- Update status.
- Generate summary dari ticket detail.
- Send email dari frontend.
- Buka email logs dari frontend.
- Login ADMIN.
- Buka knowledge/admin analytics.
- Switch light/dark/system.
- Test mobile sidebar.

### 15.3 AI/RAG Testing

Checklist:

- Chat tetap menjawab saat `GEMINI_API_KEY` kosong.
- Backfill embedding sukses saat key tersedia.
- Retrieval contexts muncul.
- Confidence score masuk akal.
- Low confidence memunculkan opsi escalation.
- Knowledge baru dapat diretrieve setelah embedding.

### 15.4 Mailpit Integration Testing

Checklist:

- Mailpit container aktif di port SMTP `1025` dan web inbox `8025`.
- Backend `.env` memakai `SMTP_HOST=localhost` dan `SMTP_PORT=1025`.
- Frontend memanggil `POST /api/reports/summary` untuk preview summary.
- Frontend memanggil `POST /api/reports/send-email` untuk mengirim email.
- Backend membuat `EmailLog` status `SENT` jika Mailpit aktif.
- Backend membuat `EmailLog` status `FAILED` jika SMTP tidak dapat dihubungi.
- `GET /api/email-logs` menampilkan log terbaru di frontend.
- Email muncul di Mailpit inbox.
- Subject, recipient, body summary, dan attachment sesuai dengan data ticket/session.

## 16. Acceptance Criteria Global

Project dianggap siap MVP jika:

- USER dapat login, chat, upload image, eskalasi ticket, lihat ticket, dan buka FAQ.
- HELPDESK dapat login, melihat ticket queue, dan update status ticket.
- ADMIN dapat login, melihat analytics/chat logs, dan mengelola knowledge.
- Swagger/OpenAPI mencerminkan endpoint yang dipakai frontend.
- Frontend tidak memanggil endpoint yang hilang.
- RAG tetap usable meski Gemini key kosong.
- README root cukup jelas untuk setup dari nol.
- Temporary mode tersedia sebelum fitur privacy-sensitive dirilis.
- Self-learning tidak langsung memasukkan chat mentah ke knowledge base.

## 17. Known Issues dan Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Frontend FAQ memanggil `/api/knowledge` yang belum ada | Halaman FAQ gagal | Tambah read-only knowledge endpoint |
| `api.js` hardcoded localhost | Deploy production susah | Gunakan `VITE_API_URL` |
| OpenAPI belum sinkron | Frontend/backend mismatch | Update OpenAPI setiap route berubah |
| Ticket detail USER belum ada | Detail stale saat refresh | Tambah `GET /api/tickets/my/:id` |
| Temporary mode belum ada | Privacy expectation tidak terpenuhi | Tambah `temporary` flow di backend |
| Chat lifecycle belum ada | UX ChatGPT-style tidak lengkap | Tambah session/message management endpoints |
| Self-learning langsung dari chat bisa salah | Knowledge base tercemar | Pakai candidate review |
| Dark mode tidak diuji | Kontras buruk | Gunakan token dan QA seluruh status badge |
| Gemini quota habis | AI bisa gagal | Pertahankan fallback mock/keyword |

## 18. Handoff Brief untuk Implementasi

Gunakan brief ini saat mengerjakan frontend redesign:

```txt
Redesign frontend Epson AI Helpdesk dengan Vue 3 agar pengalaman utama mengikuti ChatGPT-style operational UI.
Jangan buat landing page marketing.
Chat harus menjadi halaman utama untuk USER.
Gunakan sidebar history, main conversation, dan sticky bottom composer.
Tambahkan temporary mode, light/dark/system theme, delete/rename chat, edit message, regenerate answer, dan feedback.
Pastikan FAQ hanya dipakai setelah backend GET /api/knowledge tersedia.
Self-learning hanya boleh dari non-temporary chat dan harus masuk review candidate sebelum menjadi knowledge base.
Sinkronkan semua service frontend dengan OpenAPI backend.
Run npm run build setelah implementasi.
```

Gunakan brief ini saat mengerjakan backend:

```txt
Pertahankan struktur modular route-controller-service.
Tambahkan endpoint yang hilang tanpa merusak endpoint existing.
Update OpenAPI setiap menambah route.
Pastikan USER hanya bisa melihat resource miliknya.
Temporary chat tidak boleh masuk history, ticket, atau learning candidate kecuali user memilih save.
Learning candidate harus melalui review sebelum membuat KnowledgeDocument dan embedding.
```

## 19. Pertanyaan Terbuka

- Apakah USER setelah login langsung ke `/chat` atau tetap `/dashboard`?
- Apakah endpoint FAQ final tetap `/api/knowledge` atau diganti `/api/faqs`?
- Apakah delete chat harus hard delete atau soft delete untuk audit?
- Apakah HELPDESK boleh approve learning candidate, atau hanya ADMIN?
- Apakah edited message perlu menyimpan version history?
- Apakah temporary chat benar-benar stateless atau disimpan TTL pendek?
- Apakah ticket perlu assignment dan comments di MVP?
- Apakah helpdesk route dipisah `/helpdesk/*` atau memakai `/tickets` dengan role-aware UI?

## 20. Next Steps Prioritas

1. Update README root agar sesuai dokumen ini.
2. Tambah backend `GET /api/knowledge`.
3. Update OpenAPI untuk `/tickets/my`, `/knowledge`, dan schema ticket.
4. Update frontend `api.js` memakai `VITE_API_URL`.
5. Bangun AppShell ChatGPT-style.
6. Rebuild chat page.
7. Tambah temporary mode.
8. Tambah chat lifecycle endpoints.
9. Tambah learning candidate pipeline.
10. Jalankan QA end-to-end untuk role USER, HELPDESK, dan ADMIN.

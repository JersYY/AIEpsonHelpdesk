# Epson AI Helpdesk Assistant

Aplikasi helpdesk internal Epson berbasis AI/RAG. Terdiri dari **backend** (Express + Prisma + PostgreSQL/pgvector + Gemini) dan **frontend** (Vue 3 + Vite + Pinia). Mendukung auth JWT, chat troubleshooting RAG, upload gambar defect, escalation ticket, summary email via Mailpit/SMTP, knowledge base admin, analytics, ML lokal (kategori/intent/prioritas), dan self-learning melalui review candidate.

## URL Penting

| Layanan | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:4000` |
| Swagger / OpenAPI | `http://localhost:4000/api/docs` |
| OpenAPI JSON | `http://localhost:4000/api/docs.json` |
| Mailpit Inbox | `http://localhost:8025` |

## Struktur Repository

```txt
aiHelpdeskEpson/
  backend/
    prisma/            schema, migrations, seed
    src/
      config/          env, prisma, ai, openapi
      middlewares/     auth, role, error, notfound
      modules/         auth, chat, ai, ml, tickets, knowledge, reports, admin, ...
      app.js, server.js
    README.md  API.md  DEMO.md  RAG_GEMINI.md
  frontend/
    src/
      modules/ services/ stores/ router/
    README.md
  PRD.md
  BACKEND_AI_RAG.md
  README.md
```

## Environment Backend

Buat file `backend/.env`.

Contoh:

```env
PORT=4000
JWT_SECRET=isi_dengan_random_secret_panjang
DATABASE_URL="postgresql://postgres:change-me-postgres@localhost:5432/epson_helpdesk"

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

CORS_ORIGIN=http://localhost:3000
```

Jangan commit `.env`. `GEMINI_API_KEY` boleh kosong; backend akan memakai fallback mock response. Jika key aktif tetapi quota habis, generation akan fallback ke mock, sedangkan RAG tetap berjalan dengan knowledge base yang tersedia.

## Menjalankan Database

Jalankan PostgreSQL + pgvector:

```bash
docker run -d --name epson-helpdesk-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=change-me-postgres -e POSTGRES_DB=epson_helpdesk -p 5432:5432 -v epson-helpdesk-postgres-data:/var/lib/postgresql/data pgvector/pgvector:pg16
```

Jika container sudah pernah dibuat:

```bash
docker start epson-helpdesk-postgres
```

Jalankan Mailpit untuk SMTP development:

```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Jika container sudah pernah dibuat:

```bash
docker start mailpit
```

Inbox email development:

```txt
http://localhost:8025
```

## Setup Backend

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Apply migration:

```bash
npx prisma migrate deploy
```

Seed demo data:

```bash
npm run prisma:seed
```

Isi embedding knowledge lama atau data seed:

```bash
npm run rag:backfill
```

Jika `GEMINI_API_KEY` kosong atau quota habis, backfill embedding bisa gagal/dilewati. Chat tetap usable dengan fallback keyword/mock, tetapi semantic RAG terbaik membutuhkan embedding.

## Menjalankan Backend

Development:

```bash
npm run dev
```

Production-like:

```bash
npm start
```

Backend berjalan di:

```txt
http://localhost:4000
```

Health check:

```txt
GET http://localhost:4000/api/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "epson-helpdesk-api"
  }
}
```

## Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

Buat file `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

API client (`frontend/src/services/api.js`) memakai `import.meta.env.VITE_API_URL` dengan fallback `http://localhost:4000/api`, dan menangani `401` dengan menghapus token lalu redirect ke `/login`.

## Akun Demo

Login memakai `employeeId` dan `password`. Email tetap disimpan sebagai data profil user, tetapi bukan credential login utama.

| Role | Email | Employee ID | Password |
|---|---|---|---|
| ADMIN | `admin@epson.local` | `ADM001` | `Password123!` |
| USER | `operator.assembly@epson.local` | `EMP001` | `Password123!` |
| HELPDESK | `helpdesk@epson.local` | `HD001` | `Password123!` |

## Test Cepat API

Login:

```txt
POST http://localhost:4000/api/auth/login
```

Body:

```json
{
  "employeeId": "EMP001",
  "password": "Password123!"
}
```

Chat:

```txt
POST http://localhost:4000/api/chat/message
Authorization: Bearer <token>
```

Body:

```json
{
  "message": "Output printer muncul garis banding setelah maintenance. Apa yang harus saya cek dulu?"
}
```

Upload gambar:

```txt
POST http://localhost:4000/api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
field: file
```

Chat dengan gambar:

```json
{
  "message": "Output printer bergaris, saya lampirkan gambar defect",
  "imageId": "<uploaded_file_id>"
}
```

Eskalasi ticket:

```txt
POST http://localhost:4000/api/tickets/escalate
Authorization: Bearer <token>
```

Body:

```json
{
  "sessionId": "<chat_session_id>",
  "priority": "HIGH"
}
```

Kirim summary email ke Mailpit:

```txt
POST http://localhost:4000/api/reports/send-email
Authorization: Bearer <token>
```

Body:

```json
{
  "ticketId": "<ticket_id>",
  "recipientEmail": "helpdesk@epson.local",
  "subject": "Epson AI Helpdesk - Ringkasan Eskalasi"
}
```

Jika chat memiliki gambar, email akan menyertakan gambar tersebut sebagai attachment.

## Reset Database Lokal

Perintah ini menghapus semua data lokal:

```bash
cd backend
npx prisma migrate reset --force
npm run rag:backfill
```

## Stop Service Lokal

```bash
docker stop epson-helpdesk-postgres
docker stop mailpit
```

Jika backend dijalankan manual dengan `npm run dev`, hentikan dengan `Ctrl+C`.

## Dokumentasi Lanjutan

```txt
PRD.md                  PRD + dokumentasi teknis end-to-end
BACKEND_AI_RAG.md       Catatan AI/RAG tingkat repo
backend/README.md       Setup & API backend
backend/API.md          Referensi endpoint
backend/DEMO.md         Alur demo Postman
backend/RAG_GEMINI.md   Detail RAG + Gemini
frontend/README.md      Cara menjalankan UI
```

## Endpoint Penting

Auth: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
Chat: `POST /api/chat/message` (mendukung `temporary: true`), `GET /api/chat/history`, `GET /api/chat/sessions/:id`, `PATCH /api/chat/sessions/:id` (rename), `DELETE /api/chat/sessions/:id`, `POST /api/chat/sessions/:id/archive|restore`, `PATCH /api/chat/messages/:id` (edit), `POST /api/chat/messages/:id/regenerate`, `POST /api/chat/messages/:id/feedback`
Knowledge (read-only): `GET /api/knowledge`, `GET /api/knowledge/:id`, `GET /api/knowledge/suggested-questions`
Tickets: `POST /api/tickets/escalate`, `GET /api/tickets/my`, `GET /api/tickets/my/:id`, `GET /api/tickets`, `PATCH /api/tickets/:id/status`
Users: `GET/PATCH /api/users/me/preferences`
Learning (ADMIN/HELPDESK): `GET /api/learning/candidates`, `POST /api/learning/candidates/:id/approve|reject`
Admin: `GET /api/admin/analytics`, `GET /api/admin/chat-logs`, `/api/admin/knowledge` CRUD, `/api/admin/ml` train/status/predict

## Known Gaps (Frontend vs Backend)

- Frontend UI ChatGPT-style (AppShell, sidebar, composer) belum sepenuhnya direbuild; service & endpoint backend sudah siap.
- Theme light/dark/system saat ini dipersist via endpoint preferences + localStorage fallback.
- Halaman admin learning-candidate review masih perlu UI; endpoint backend sudah tersedia.
- Gemini free tier dapat kena rate limit; chat otomatis fallback ke mock yang tetap aman dan terstruktur.

## Catatan ML & Self-learning

- Klasifikasi kategori/intent/prioritas memakai model lokal (Naive Bayes + TF-IDF), dilatih saat startup, tanpa dependensi API.
- Self-learning TIDAK mengubah knowledge base secara otomatis. Chat tervalidasi (feedback helpful / ticket resolved) hanya membuat **KnowledgeCandidate** berstatus `PENDING` yang wajib di-review admin/helpdesk sebelum menjadi `KnowledgeDocument`.
- Temporary chat tidak masuk history, tidak membuat ticket/candidate, dan tidak dipakai self-learning.

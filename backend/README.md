# Epson AI Helpdesk Assistant Backend

Backend API modular untuk sistem helpdesk internal Epson berbasis AI/RAG. API ini mendukung login karyawan, dashboard user, chat troubleshooting, upload gambar defect, popular issues, escalation ticket, summary report email, knowledge base admin, chat logs, dan analytics.

## Fitur Utama

- Auth JWT dengan bcrypt password hashing.
- Role `USER`, `ADMIN`, dan `HELPDESK`.
- Dashboard user dengan quick actions, popular issues, dan recent activity.
- Chat AI/RAG dengan Gemini, semantic search pgvector, fallback keyword search, dan mock response saat `GEMINI_API_KEY` kosong.
- Upload gambar defect via multer: JPEG, PNG, WEBP, maksimal 5MB.
- Admin CRUD knowledge base dengan auto chunking dan auto embedding untuk RAG.
- Admin chat logs dan analytics.
- Escalation ticket dan status workflow.
- Summary report dan email via nodemailer/Mailpit.
- Global response format, error handler, not found middleware, helmet, cors, morgan.

## Tech Stack

Node.js, Express.js, PostgreSQL, Prisma, pgvector, JWT, bcrypt, multer, nodemailer, dotenv, cors, helmet, morgan, `@prisma/adapter-pg`, dan `pg`.

## Struktur Folder

```txt
backend/
  prisma.config.js
  prisma/
    migrations/
    schema.prisma
    seed.js
    sql/
      enable_pgvector.sql
  src/
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
    app.js
    server.js
  uploads/
  API.md
  DEMO.md
  RAG_GEMINI.md
  README.md
```

## Environment Variables

Salin nilai yang dibutuhkan ke `.env`.

```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/epson_helpdesk
JWT_SECRET=change-me
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
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=helpdesk@epson.local
CORS_ORIGIN=http://localhost:3000
```

## Setup Singkat

1. Pastikan PostgreSQL aktif dan database sudah dibuat.
2. Pastikan pgvector sudah ter-install di PostgreSQL server.
3. Isi `.env` sesuai environment lokal.
4. Generate Prisma Client: `npm run prisma:generate`.
5. Aktifkan extension pgvector di database:

```bash
npx prisma db execute --file prisma/sql/enable_pgvector.sql
```

6. Jalankan migration pertama:

```bash
npm run prisma:migrate -- --name init
```

7. Jalankan seed:

```bash
npm run prisma:seed
```

Seed command dikonfigurasi di `prisma.config.js` pada `migrations.seed` untuk kompatibilitas Prisma 7.

8. Jika `GEMINI_API_KEY` sudah diisi, jalankan backfill embedding untuk data knowledge lama:

```bash
npm run rag:backfill
```

Jika `GEMINI_API_KEY` kosong, command backfill akan dilewati dan chat tetap berjalan dengan fallback keyword/mock.

## Status Database Lokal

Database lokal sudah pernah berhasil disiapkan dengan hasil seed:

```json
{
  "users": 3,
  "categories": 6,
  "knowledgeDocuments": 3,
  "knowledgeChunks": 3,
  "suggestedQuestions": 5
}
```

## Reset Database

Untuk menghapus semua data, menjalankan ulang migration, dan seed ulang:

```bash
npx prisma migrate reset
```

Saat prompt muncul, jawab `y`. Prisma akan drop schema, apply ulang migration, lalu menjalankan seed dari `prisma.config.js`.

Jika ingin non-interactive:

```bash
npx prisma migrate reset --force
```

Jika reset gagal karena extension `vector` belum aktif, jalankan ulang:

```bash
npx prisma db execute --file prisma/sql/enable_pgvector.sql
npx prisma migrate reset --force
```

Untuk reset manual yang lebih eksplisit:

```bash
npx prisma migrate reset --force --skip-seed
npx prisma db execute --file prisma/sql/enable_pgvector.sql
npm run prisma:seed
```

Catatan: reset database akan menghapus semua chat, upload metadata, tickets, email logs, dan data seed lama di database target `DATABASE_URL`.

## Menjalankan Backend

- Development: `npm run dev`
- Production-like: `npm start`

Default API berjalan di `http://localhost:4000`.

## CORS untuk Frontend

Backend membaca origin frontend dari environment variable `CORS_ORIGIN`.

Contoh untuk frontend lokal Vite/React:

```env
CORS_ORIGIN=http://localhost:5173
```

Contoh untuk frontend Next.js/default React:

```env
CORS_ORIGIN=http://localhost:3000
```

Jika frontend memakai port lain, sesuaikan nilainya dengan origin browser yang sebenarnya, termasuk protocol dan port:

```env
CORS_ORIGIN=http://localhost:8080
```

Setelah mengubah `.env`, restart backend:

```bash
npm run dev
```

Frontend harus mengirim request ke backend:

```txt
http://localhost:4000/api
```

Untuk endpoint protected, frontend wajib mengirim header:

```http
Authorization: Bearer <token>
```

Catatan: jangan isi `CORS_ORIGIN` dengan URL backend. Isi dengan URL frontend yang berjalan di browser.

## Akun Demo

| Role | Email | Employee ID | Password |
|---|---|---|---|
| ADMIN | `admin@epson.local` | `ADM001` | `Password123!` |
| USER | `operator.assembly@epson.local` | `EMP001` | `Password123!` |
| HELPDESK | `helpdesk@epson.local` | `HD001` | `Password123!` |

## Endpoint Overview

- Health: `GET /api/health`
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Dashboard: `GET /api/dashboard/user`, `GET /api/issues/popular`, `GET /api/activity/recent`
- Chat: `POST /api/chat/message`, `GET /api/chat/history`, `GET /api/chat/sessions/:id`
- Files: `POST /api/files/upload`, `GET /api/files/:id`, `DELETE /api/files/:id`
- Admin Knowledge: `GET|POST /api/admin/knowledge`, `PUT|DELETE /api/admin/knowledge/:id`
- Admin Chat Logs: `GET /api/admin/chat-logs`, `GET /api/admin/chat-logs/:id`
- Admin Analytics: `GET /api/admin/analytics`, `GET /api/admin/top-issues`
- Tickets: `POST /api/tickets/escalate`, `GET /api/tickets`, `GET /api/tickets/:id`, `PATCH /api/tickets/:id/status`
- Reports/Email: `POST /api/reports/summary`, `POST /api/reports/send-email`, `GET /api/email-logs`

## Demo End-to-End

Panduan demo dari setup, login user, chat AI, upload defect image, escalation ticket, summary email, sampai admin/helpdesk workflow tersedia di `DEMO.md`.

## Integrasi RAG Gemini

Panduan detail tersedia di `RAG_GEMINI.md`. Implementasi saat ini sudah mencakup Gemini generation, Gemini embeddings, semantic search pgvector, fallback keyword search, timeout, retry terbatas, safety settings, dan confidence score berbasis retrieval.

Kode AI/RAG disiapkan di:

```txt
src/modules/ai/
```

Alur self-learning RAG:

```txt
Admin membuat/mengubah KnowledgeDocument
  -> content dipecah menjadi KnowledgeChunk
  -> Gemini membuat embedding RETRIEVAL_DOCUMENT
  -> embedding disimpan ke pgvector
  -> user bertanya
  -> query dibuat embedding RETRIEVAL_QUERY
  -> pgvector mengambil chunk paling relevan
  -> Gemini menjawab berdasarkan context
```

Catatan: "self-learning" di sini berarti AI otomatis memakai knowledge base baru setelah admin menambahkan atau memperbarui dokumen. Ini bukan fine-tuning/model training otomatis dari percakapan user, supaya data produksi tetap aman dan jawaban tetap bisa diaudit.

Command penting:

```bash
npm run rag:backfill
```

Gunakan command tersebut setelah seed, import data lama, atau migration dari sistem sebelumnya agar semua `KnowledgeChunk` lama memiliki embedding.

## Mailpit

Untuk development, gunakan Mailpit dengan `SMTP_HOST=localhost` dan `SMTP_PORT=1025`. `SMTP_USER` dan `SMTP_PASS` boleh kosong. Endpoint send-email tetap mencatat `EmailLog` dengan status `SENT` atau `FAILED`.

Jalankan Mailpit dengan Docker:

```bash
docker run --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Konfigurasi `.env` untuk Mailpit:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=helpdesk@epson.local
```

Inbox Mailpit dapat dibuka di:

```txt
http://localhost:8025
```

Setelah `.env` diubah, restart backend:

```bash
npm run dev
```

Untuk SMTP production, gunakan konfigurasi provider email perusahaan:

```env
SMTP_HOST=smtp.your-company.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=helpdesk@epson.local
```

## pgvector

Di mesin Windows ini, pgvector `v0.8.2` sudah dibuild dan di-install untuk PostgreSQL 16. File penting yang harus ada:

```txt
C:\Program Files\PostgreSQL\16\lib\vector.dll
C:\Program Files\PostgreSQL\16\share\extension\vector.control
```

Aktifkan extension di database sebelum migration:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Atau jalankan:

```bash
npx prisma db execute --file prisma/sql/enable_pgvector.sql
```

Field embedding disimpan sebagai `Unsupported("vector(768)")?` pada model `KnowledgeChunk`. Dimensi default mengikuti `GEMINI_EMBEDDING_DIM=768`; jika dimensi diubah, migration SQL dan semua embedding lama harus dibuat ulang dengan dimensi yang sama.

Migration RAG menambahkan index HNSW:

```sql
CREATE INDEX IF NOT EXISTS "knowledge_chunk_embedding_hnsw_idx"
ON "KnowledgeChunk"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;
```

Saat embedding belum tersedia, `GEMINI_API_KEY` kosong, atau pgvector error, RAG otomatis memakai fallback full-text/keyword search.

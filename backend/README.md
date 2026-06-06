# Epson Helpdesk Backend

Backend API modular untuk sistem helpdesk internal Epson berbasis AI/RAG. API ini mendukung login karyawan, dashboard user, chat troubleshooting, upload gambar defect, popular issues live, escalation ticket, summary ticket/email multi-section, knowledge base admin, chat logs, analytics, ML lokal, dan Mailpit/SMTP.

## Fitur Utama

- Auth JWT dengan bcrypt password hashing dan approval akun operator.
- Role `USER`, `ADMIN`, dan `HELPDESK`; register publik hanya membuat `USER` berstatus `PENDING`.
- Dashboard user dengan quick actions, popular issues berbasis chat/ticket 30 hari terakhir, dan recent activity.
- Chat AI/RAG dengan Gemini, semantic search pgvector, fallback keyword search, dan mock response saat `GEMINI_API_KEY` kosong.
- Upload gambar defect via multer: JPEG, PNG, WEBP, maksimal 5MB.
- Admin CRUD knowledge base dengan auto chunking dan auto embedding untuk RAG.
- Admin chat logs dan analytics.
- Escalation ticket, status workflow, dan thread balasan antara helpdesk/admin dengan operator.
- Summary ticket/report multi-section yang menampilkan masalah utama, konteks, respons AI terakhir, tindak lanjut helpdesk, lampiran, dan riwayat singkat.
- Email report via nodemailer/Mailpit dengan response `source` dan `mailpitUrl` untuk flow web helpdesk.
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
      ml/
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
MAILPIT_WEB_URL=http://localhost:8025
CORS_ORIGIN=http://localhost:5173
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

Seed lokal hanya mengisi akun `ADMIN` dan `HELPDESK`, category master awal, dan knowledge base awal. Knowledge seed memakai title berbahasa Inggris dengan isi/deskripsi SOP berbahasa Indonesia. Akun operator `USER` dibuat lewat register. Data operasional lain seperti chat, tickets, email logs, learning candidates, dan suggested questions bisa dibuat manual dari UI/API.

Expected data setelah seed fresh:

```json
{
  "users": 2,
  "categories": 6,
  "knowledgeDocuments": 3,
  "knowledgeChunks": 3
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

Contoh untuk frontend lokal Vue/Vite:

```env
CORS_ORIGIN=http://localhost:5173
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

Login memakai `employeeId` dan `password`. Email tetap disimpan sebagai data profil user, tetapi bukan credential login utama. Seed hanya membuat admin dan helpdesk; operator mendaftar melalui `/api/auth/register` atau UI `/register`, lalu harus disetujui admin sebelum bisa mengakses fitur protected.

| Role | Email | Employee ID | Password |
|---|---|---|---|
| ADMIN | `admin@epson.local` | `ADM001` | `Password123!` |
| HELPDESK | `helpdesk@epson.local` | `HD001` | `Password123!` |

## Endpoint Overview

- Health: `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Dashboard: `GET /api/dashboard`, `GET /api/dashboard/popular-issues`, `GET /api/dashboard/recent-activity`
- Chat: `POST /api/chat/message`, `GET /api/chat/history`, `GET /api/chat/sessions/:id`, `PATCH /api/chat/sessions/:id`, `DELETE /api/chat/sessions/:id`, `POST /api/chat/messages/:id/feedback`, `POST /api/chat/messages/:id/regenerate`
- Files: `POST /api/files/upload`, `GET /api/files/:id`, `DELETE /api/files/:id`
- Admin Categories: `GET|POST /api/admin/categories`, `PATCH|DELETE /api/admin/categories/:id`
- Admin Knowledge: `GET|POST /api/admin/knowledge`, `PUT|DELETE /api/admin/knowledge/:id`
- Admin Chat Logs: `GET /api/admin/chat-logs`, `GET /api/admin/chat-logs/:id`
- Admin Analytics: `GET /api/admin/analytics`, `GET /api/admin/top-issues`
- Admin Accounts: `GET /api/admin/accounts`, `PATCH /api/admin/accounts/:id/status`
- Tickets: `POST /api/tickets/escalate`, `GET /api/tickets/my`, `GET /api/tickets/my/:id`, `POST /api/tickets/my/:id/comments`, `PATCH /api/tickets/my/:id/resolution`, `GET /api/tickets`, `GET /api/tickets/:id`, `POST /api/tickets/:id/comments`, `PATCH /api/tickets/:id/status`
- Reports/Email: `POST /api/reports/summary`, `POST /api/reports/send-email`, `GET /api/email-logs`
- Users: `GET/PATCH /api/users/me/preferences`
- Learning: `GET /api/learning/candidates`, `POST /api/learning/candidates/:id/approve|reject`

### Catatan Popular Issues

`GET /api/dashboard/popular-issues` menghitung kategori dari `ChatSession` non-temporary/non-deleted dan `EscalationTicket` dalam window 30 hari terakhir. Jika belum ada aktivitas, response fallback ke seed `IssueCategory` dengan `count: 0`.

### Catatan Approval Akun Operator

`POST /api/auth/register` selalu membuat role `USER` dengan `accountStatus: PENDING`. Akun pending tetap bisa login dan membuka `/api/auth/me`, tetapi endpoint protected lain akan mengembalikan `403` sampai admin mengubah status menjadi `ACTIVE`.

Admin dapat melihat dan meninjau akun operator:

```txt
GET /api/admin/accounts?status=PENDING
PATCH /api/admin/accounts/:id/status
```

Body patch:

```json
{ "status": "ACTIVE", "reviewNote": "Verified by admin" }
```

### Catatan Category Master

`/api/admin/categories` adalah master data category untuk chat, ticket, knowledge, dan learning candidate. Admin dapat membuat category sebelum membuat knowledge document, atau membuatnya cepat dari form knowledge di frontend. Delete category diblokir jika category masih dipakai data lain supaya riwayat operasional tidak kehilangan konteks.

### Catatan Ticket Detail dan Summary

`GET /api/tickets/:id` untuk `ADMIN`/`HELPDESK` mengembalikan `session.messages[]` read-only agar UI bisa menampilkan history chat pada detail ticket. Field `summary` di response memakai format multi-section terbaru, termasuk untuk ticket lama yang masih menyimpan summary format lama di database.

Ticket memiliki `comments[]` sebagai thread balasan web. Helpdesk/admin dapat mengirim solusi melalui `POST /api/tickets/:id/comments`; operator membalas melalui `POST /api/tickets/my/:id/comments`, lalu mengonfirmasi hasil solusi memakai `PATCH /api/tickets/my/:id/resolution`. Jika `resolved: true`, ticket menjadi `CLOSED` dan session ditandai `RESOLVED`; jika `resolved: false`, ticket kembali `IN_PROGRESS`.

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

Untuk development, gunakan Mailpit dengan `SMTP_HOST=localhost` dan `SMTP_PORT=1025`. `SMTP_USER` dan `SMTP_PASS` boleh kosong. Endpoint send-email tetap mencatat `EmailLog` dengan status `SENT` atau `FAILED`, lalu mengembalikan `source.ticketId`, `source.sessionId`, dan `mailpitUrl` untuk dipakai UI helpdesk. Email/Mailpit berfungsi sebagai notifikasi dan arsip; penyampaian solusi ke operator tetap dilakukan dari thread balasan ticket di web.

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
MAILPIT_WEB_URL=http://localhost:8025
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

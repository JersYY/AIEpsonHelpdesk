# Epson AI Helpdesk Assistant

Backend API untuk sistem helpdesk internal Epson berbasis AI/RAG. Backend mendukung auth JWT, chat troubleshooting, upload gambar defect, RAG dengan Gemini embeddings + pgvector, escalation ticket, summary email via Mailpit/SMTP, knowledge base admin, dan analytics.

Catatan scope: panduan ini fokus ke backend. Frontend tidak termasuk bagian yang perlu dipush untuk perubahan backend-only.

## Versi Kompatibel

Versi yang sudah dites di mesin lokal:

| Komponen | Versi |
|---|---|
| Node.js | `v24.13.1` |
| npm | `10.3.0` |
| Docker Engine | `27.3.1` |
| PostgreSQL | `16` via image `pgvector/pgvector:pg16` |
| pgvector | `0.8.2` |
| Prisma | `7.8.0` |
| Express | `5.2.1` |

Rekomendasi minimal: gunakan Node.js modern yang kompatibel dengan Prisma 7, PostgreSQL 16, dan pgvector. Cara paling stabil untuk development adalah memakai Docker Desktop untuk PostgreSQL + Mailpit.

## Struktur

```txt
aiHelpdeskEpson/
  backend/
    prisma/
    src/
    README.md
    API.md
    DEMO.md
    RAG_GEMINI.md
  frontend/   # tidak dibahas untuk push backend-only
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

## Akun Demo

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
  "email": "operator.assembly@epson.local",
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
backend/README.md
backend/API.md
backend/DEMO.md
backend/RAG_GEMINI.md
```

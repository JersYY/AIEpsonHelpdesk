# Epson AI Helpdesk Assistant

Monorepo untuk **Epson AI Helpdesk Assistant**, sistem helpdesk internal berbasis AI/RAG untuk membantu troubleshooting masalah produksi di lingkungan manufaktur.

Project ini dibagi menjadi dua bagian:

```txt
aiHelpdeskEpson/
  backend/
  frontend/
```

## Status Project

| Area | Status | Keterangan |
|---|---|---|
| Backend | Ready | Node.js/Express API, PostgreSQL, Prisma, pgvector, JWT, upload file, tickets, reports, admin analytics, AI/RAG scaffold |
| Frontend | Placeholder | Folder tersedia, implementasi frontend belum dibuat |

## Backend

Backend berada di folder:

```txt
backend/
```

Dokumentasi backend detail:

```txt
backend/README.md
backend/API.md
backend/DEMO.md
backend/RAG_GEMINI.md
```

### Tech Stack Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma
- pgvector
- JWT
- bcrypt
- multer
- nodemailer
- dotenv
- cors
- helmet
- morgan

AI/RAG backend boundary tersedia di:

```txt
backend/src/modules/ai/
```

Folder tersebut disiapkan untuk AI engineer melanjutkan embedding, retrieval, prompt, dan provider Gemini.

### Environment Backend

Buat file:

```txt
backend/.env
```

Contoh isi:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/epson_helpdesk
JWT_SECRET=isi_dengan_random_secret_panjang
GEMINI_API_KEY=
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=helpdesk@epson.local
CORS_ORIGIN=http://localhost:3000
```

Catatan:

- `JWT_SECRET` wajib diisi string random panjang.
- `GEMINI_API_KEY` boleh kosong untuk development; backend akan memakai mock AI response.
- `CORS_ORIGIN` diisi URL frontend yang berjalan di browser, bukan URL backend.

### Menjalankan Backend

Masuk ke folder backend:

```bash
cd backend
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Aktifkan pgvector di database:

```bash
npx prisma db execute --file prisma/sql/enable_pgvector.sql
```

Jalankan migration:

```bash
npm run prisma:migrate -- --name init
```

Jalankan seed:

```bash
npm run prisma:seed
```

Jalankan backend development server:

```bash
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

### Akun Demo Backend

| Role | Email | Employee ID | Password |
|---|---|---|---|
| ADMIN | `admin@epson.local` | `ADM001` | `Password123!` |
| USER | `operator.assembly@epson.local` | `EMP001` | `Password123!` |
| HELPDESK | `helpdesk@epson.local` | `HD001` | `Password123!` |

### Reset Database Backend

Untuk mengulang data demo dari awal:

```bash
cd backend
npx prisma migrate reset --force
npx prisma db execute --file prisma/sql/enable_pgvector.sql
npm run prisma:seed
```

Reset akan menghapus semua data di database target `DATABASE_URL`.

### SMTP Development

Untuk email development, gunakan Mailpit:

```bash
docker run --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Inbox:

```txt
http://localhost:8025
```

`.env` backend:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=helpdesk@epson.local
```

### Integrasi Frontend ke Backend

Frontend nanti memanggil backend dengan base URL:

```txt
http://localhost:4000/api
```

Untuk endpoint protected, sertakan token:

```http
Authorization: Bearer <token>
```

Pastikan `backend/.env` berisi origin frontend:

```env
CORS_ORIGIN=http://localhost:3000
```

Jika frontend memakai Vite:

```env
CORS_ORIGIN=http://localhost:5173
```

Restart backend setelah mengubah `.env`.

## Frontend

Frontend berada di folder:

```txt
frontend/
```

Saat ini folder frontend masih placeholder dan belum memiliki konfigurasi aplikasi.

Rencana integrasi frontend:

- Login page memakai `POST /api/auth/login`.
- Simpan JWT di client state/storage sesuai kebijakan keamanan frontend.
- Dashboard user memakai `GET /api/dashboard/user`.
- Chat UI memakai `POST /api/chat/message`.
- Upload defect image memakai `POST /api/files/upload`.
- Ticket escalation memakai `POST /api/tickets/escalate`.
- Admin pages memakai endpoint `/api/admin/*`.

Jika frontend sudah dibuat, dokumentasikan command run di bagian ini.

## Dokumentasi API dan Demo

Endpoint lengkap:

```txt
backend/API.md
```

Demo Postman end-to-end:

```txt
backend/DEMO.md
```

Panduan RAG Gemini:

```txt
backend/RAG_GEMINI.md
```

## Quick Start Backend

```bash
cd backend
npm run prisma:generate
npx prisma db execute --file prisma/sql/enable_pgvector.sql
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Lalu buka:

```txt
http://localhost:4000/api/health
```

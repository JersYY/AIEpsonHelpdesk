# Deployment Guide: Vercel + Supabase + Gmail SMTP

Panduan ini menjelaskan rencana deploy Epson Helpdesk dengan:

- Frontend Vue/Vite di Vercel.
- Backend Express di Vercel Functions.
- Database PostgreSQL di Supabase.
- Upload gambar di Supabase Storage.
- Email ringkasan ticket memakai Gmail SMTP.

> Catatan penting: Vercel serverless tidak cocok untuk menyimpan file permanen di folder lokal `uploads/`. Sebelum deploy production, upload gambar perlu dipindah ke Supabase Storage.

## 1. Arsitektur Production

```txt
Browser user
  -> Frontend Vercel
  -> Backend Vercel Functions
  -> Supabase PostgreSQL
  -> Supabase Storage
  -> DeepSeek / Gemini API
  -> Gmail SMTP
```

Alur utama ticket tetap di web:

```txt
Operator chat AI -> Eskalasi ticket -> Helpdesk balas di thread ticket -> Operator konfirmasi hasil
```

Email hanya opsional untuk:

- Notifikasi ringkasan ticket.
- Arsip pengiriman.
- Kirim summary ke lead/supervisor.

## 2. Persiapan Supabase

1. Buat project baru di Supabase.
2. Ambil connection string PostgreSQL dari Supabase.
3. Gunakan connection pooler untuk deploy serverless.
4. Aktifkan pgvector bila masih memakai semantic RAG:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

5. Buat bucket storage:

```txt
helpdesk-uploads
```

6. Simpan env backend:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=helpdesk-uploads
```

Catatan:

- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan di backend environment.
- Jangan expose key ini ke frontend.
- Bucket boleh private; backend yang melayani akses file.

## 3. Persiapan Gmail SMTP

1. Aktifkan 2-Step Verification di akun Gmail.
2. Buat App Password.
3. Isi env backend:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password_16_digit
SMTP_FROM=email@gmail.com
MAILPIT_WEB_URL=
```

Catatan:

- Gmail SMTP cocok untuk demo/capstone.
- Untuk production serius, gunakan SMTP perusahaan atau layanan email seperti Brevo, SendGrid, Mailgun, atau Amazon SES.
- `MAILPIT_WEB_URL` dikosongkan di production.

## 4. Penyesuaian Backend Sebelum Deploy

Backend saat ini memakai Express biasa dengan `src/server.js` untuk lokal. Untuk Vercel Functions, perlu entrypoint serverless yang meng-export app tanpa `listen`.

Target perubahan:

```txt
backend/
  api/
    index.js
  src/
    app.js
    server.js
```

Isi konsep `api/index.js`:

```js
import app from "../src/app.js";

export default app;
```

Tetap gunakan `src/server.js` untuk lokal:

```bash
npm run dev
```

Tambahkan `vercel.json` backend:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.js" }
  ]
}
```

## 5. Penyesuaian Upload Gambar

Masalah saat ini:

```txt
multer -> folder uploads lokal
```

Untuk Vercel, ubah menjadi:

```txt
multer memoryStorage -> Supabase Storage -> simpan path/url ke UploadedFile.storagePath
```

Perilaku yang harus dipertahankan:

- `POST /api/files/upload` tetap menerima multipart `file`.
- `GET /api/files/:id` tetap bisa membuka lampiran.
- Chat/ticket tetap menampilkan gambar.
- Metadata file tetap tersimpan di tabel `UploadedFile`.

Env tambahan:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=helpdesk-uploads
```

## 6. Deploy Backend ke Vercel

1. Buat project Vercel baru untuk folder `backend`.
2. Set framework sebagai Other.
3. Set root directory:

```txt
backend
```

4. Tambahkan environment variables:

```env
NODE_ENV=production
JWT_SECRET=...
DATABASE_URL=...
CORS_ORIGIN=https://frontend-domain.vercel.app

DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_MODE=hemat

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_VISION_MODEL=gemini-2.5-flash-lite
RAG_MODE=keyword

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=helpdesk-uploads

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
MAILPIT_WEB_URL=
```

5. Jalankan migration ke Supabase dari lokal atau CI:

Untuk deploy pertama atau demo fresh, reset database dulu.

> Peringatan: command ini menghapus semua data di database target. Pastikan `DATABASE_URL` sudah mengarah ke database Supabase yang benar.

```bash
cd backend
npx prisma migrate reset
```

Saat prompt muncul, jawab `y`. Prisma akan drop schema, apply ulang migration, lalu menjalankan seed bila seed terkonfigurasi.

Jika tidak ingin reset data, jalankan migration biasa:

```bash
cd backend
npx prisma migrate deploy
npm run prisma:seed
```

6. Test endpoint:

```txt
https://backend-domain.vercel.app/api/health
https://backend-domain.vercel.app/api/docs
```

## 7. Deploy Frontend ke Vercel

1. Buat project Vercel baru untuk folder `frontend`.
2. Set root directory:

```txt
frontend
```

3. Build command:

```bash
npm run build
```

4. Output directory:

```txt
dist
```

5. Tambahkan env:

```env
VITE_API_URL=https://backend-domain.vercel.app/api
```

6. Redeploy frontend setelah backend URL final tersedia.

## 8. Post-Deploy Checklist

### Auth

- Login admin seed.
- Login helpdesk seed.
- Register operator baru.
- Approve operator dari admin.

### Chat AI

- Kirim pertanyaan teks biasa.
- Pastikan jawaban memakai DeepSeek.
- Upload gambar.
- Pastikan jawaban gambar memakai Gemini Vision.
- Pastikan gambar tersimpan di Supabase Storage.

### Ticket

- Operator eskalasi ticket.
- Helpdesk membuka Ticket Queue.
- Helpdesk balas melalui thread ticket.
- Operator melihat balasan di My Tickets.
- Operator menutup ticket jika solved.

### Email

- Helpdesk generate ringkasan.
- Kirim ringkasan ke email Gmail/penerima.
- Pastikan `EmailLog` tercatat `SENT` atau `FAILED`.
- Pastikan tidak ada tombol Mailpit di production jika `MAILPIT_WEB_URL` kosong.

### Security

- `CORS_ORIGIN` hanya domain frontend production.
- Semua secret hanya di Vercel/Supabase dashboard.
- `SUPABASE_SERVICE_ROLE_KEY` tidak pernah masuk frontend.
- `.env` lokal tidak ikut commit.

## 9. Known Risk dan Solusi

| Risiko | Dampak | Solusi |
|---|---|---|
| Upload masih lokal | Gambar hilang di Vercel | Pindah ke Supabase Storage |
| Gmail SMTP limit | Email gagal jika terlalu banyak | Cukup untuk demo; production pakai email provider |
| Vercel function timeout | AI response bisa timeout | Pakai mode hemat, token kecil, retry rendah |
| Prisma + serverless connection | Terlalu banyak DB connection | Pakai Supabase pooler |
| CORS salah | Frontend gagal akses API | Set `CORS_ORIGIN` ke domain frontend |

## 10. Referensi

- Vercel Express: https://vercel.com/docs/frameworks/backend/express
- Supabase Postgres connection: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Prisma: https://supabase.com/docs/guides/database/prisma
- Supabase Storage: https://supabase.com/docs/guides/storage
- Gmail App Password: https://support.google.com/mail/answer/185833

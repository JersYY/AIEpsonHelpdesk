# Epson Helpdesk Frontend

Frontend Vue 3 + Vite untuk Epson Helpdesk. UI saat ini memakai AppShell bergaya ChatGPT, landing page publik sebelum login, register operator, login screen yang konsisten dengan dashboard, dark mode, dan motion halus lewat `@vueuse/motion`.

## Tech Stack

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- Font Awesome
- `@vueuse/motion`

## Setup

```bash
cd frontend
npm install
```

Buat file `.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Jalankan development server:

```bash
npm run dev
```

Frontend berjalan di:

```txt
http://localhost:5173
```

## Route Utama

- `/` - landing page publik dengan hamburger navbar berisi light/dark switch, login, dan register.
- `/login` - login karyawan dengan `employeeId`, password, dan tombol kembali ke landing page.
- `/register` - registrasi operator baru. Role hasil register selalu `USER` dengan status awal `PENDING`; admin/helpdesk dibuat terpisah.
- `/pending-approval` - halaman terkunci untuk operator yang sudah register tetapi belum disetujui admin.
- `/chat` - chat troubleshooting untuk role `USER`.
- `/dashboard` - dashboard user dengan quick actions, Popular Issues live 30 hari, dan recent activity.
- `/tickets` - ticket milik user, thread balasan helpdesk, dan konfirmasi solusi.
- `/helpdesk/tickets` - queue ticket untuk `HELPDESK`/`ADMIN`.
- `/helpdesk/tickets/:id` - detail ticket, summary, thread balasan ke operator, history chat, dan email report.
- `/helpdesk/email-logs` - riwayat email report.
- `/admin/accounts` - approval akun operator baru.
- `/admin/*` - area admin analytics, chat logs, account approval, knowledge documents, category master, dan learning review.

## Catatan UI

- Authenticated user yang membuka `/`, `/login`, atau `/register` akan diarahkan ke halaman default sesuai role. Logout dari AppShell mengembalikan user ke landing page.
- Operator pending yang login/register diarahkan ke `/pending-approval`; setelah admin approve, tombol "Cek Status" akan mengarahkan ke dashboard role terkait.
- Theme disimpan lewat preferences API dan fallback localStorage.
- Popular Issues auto-refresh tiap 10 detik di dashboard.
- Bubble chat menampilkan catatan ketika jawaban AI tidak memakai rujukan knowledge base, supaya user tahu kapan sebaiknya eskalasi.
- Flow email report menerima `mailpitUrl` dari backend, sehingga UI dapat membuka Mailpit, Email Logs, dan history chat terkait. Email dipakai sebagai notifikasi/arsip, sementara tindak lanjut kasus dilakukan lewat thread balasan ticket.
- Admin Knowledge Base punya tab Documents dan Categories; category bisa dibuat dari tab khusus atau langsung dari modal dokumen.
- Landing internal Epson, hamburger menu, login/register, pending approval, AppShell, dashboard, chat, tickets, dan admin views dirancang responsive untuk ponsel, tablet, dan desktop.

## Build

```bash
npm run build
```

Pastikan backend berjalan di `http://localhost:4000` dan `CORS_ORIGIN` backend mengarah ke origin frontend, biasanya `http://localhost:5173`.

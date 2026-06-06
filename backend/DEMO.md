# Postman Demo: Epson Helpdesk Backend

Dokumen ini berisi alur demo end-to-end memakai Postman.

## 1. Jalankan Backend

Pastikan database sudah migrate dan seed, lalu jalankan backend:

```bash
npm run dev
```

Base URL:

```txt
http://localhost:4000
```

## 2. Buat Postman Environment

Buat environment baru, misalnya `Epson Helpdesk Local`.

Tambahkan variables:

| Variable | Initial Value | Current Value |
|---|---|---|
| `base_url` | `http://localhost:4000` | `http://localhost:4000` |
| `user_token` | kosong | kosong |
| `admin_token` | kosong | kosong |
| `helpdesk_token` | kosong | kosong |
| `operator_user_id` | kosong | kosong |
| `session_id` | kosong | kosong |
| `image_id` | kosong | kosong |
| `ticket_id` | kosong | kosong |
| `category_id` | kosong | kosong |
| `knowledge_id` | kosong | kosong |

Aktifkan environment tersebut sebelum menjalankan request.

## 3. Health Check

Request:

```txt
GET {{base_url}}/api/health
```

Auth:

```txt
No Auth
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "epson-helpdesk-api",
    "timestamp": "2026-04-29T00:00:00.000Z"
  }
}
```

## 4. Register User Operator

Request:

```txt
POST {{base_url}}/api/auth/register
```

Headers:

```txt
Content-Type: application/json
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

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("user_token", json.data.token);
pm.environment.set("operator_user_id", json.data.user.id);
```

Expected:

```json
{
  "success": true,
  "data": {
    "user": {
      "employeeId": "EMP002",
      "role": "USER",
      "accountStatus": "PENDING"
    },
    "token": "jwt-token"
  }
}
```

## 5. Get Current User

Request:

```txt
GET {{base_url}}/api/auth/me
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Expected data:

```json
{
  "employeeId": "EMP002",
  "name": "Production Operator",
  "role": "USER",
  "accountStatus": "PENDING"
}
```

## 5A. Approve Operator Sebelum Lanjut Demo User

Operator hasil register masih terkunci sampai admin approve. Jika langkah ini dilewati, endpoint protected seperti dashboard, chat, ticket, dan upload akan mengembalikan `403`.

Login admin:

```txt
POST {{base_url}}/api/auth/login
```

Body:

```json
{
  "employeeId": "ADM001",
  "password": "Password123!"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("admin_token", json.data.token);
```

List akun pending:

```txt
GET {{base_url}}/api/admin/accounts?status=PENDING
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

Approve operator:

```txt
PATCH {{base_url}}/api/admin/accounts/{{operator_user_id}}/status
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

Body:

```json
{
  "status": "ACTIVE",
  "reviewNote": "Verified for demo"
}
```

Setelah approve, token user yang dibuat saat register dapat dipakai untuk langkah dashboard dan chat di bawah.

## 6. User Dashboard

Request:

```txt
GET {{base_url}}/api/dashboard
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Expected data contains:

```json
{
  "user": {},
  "quickActions": [],
  "popularIssues": [],
  "recentActivity": []
}
```

## 7. Popular Issues

Request:

```txt
GET {{base_url}}/api/dashboard/popular-issues
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Note: endpoint ini menghitung `ChatSession` non-temporary/non-deleted dan `EscalationTicket` per kategori dalam window 30 hari terakhir. Saat belum ada chat/ticket, response fallback ke seed `IssueCategory` dengan `count: 0`.

## 8. Start Chat

Request:

```txt
POST {{base_url}}/api/chat/message
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Headers:

```txt
Content-Type: application/json
```

Body:

```json
{
  "message": "Printer output has banding lines after maintenance. What should I check first?"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("session_id", json.data.session.id);
```

Expected response contains:

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "status": "ACTIVE"
    },
    "userMessage": {
      "sender": "USER"
    },
    "aiMessage": {
      "sender": "AI",
      "confidenceScore": 0.82,
      "knowledgeGrounded": true,
      "responseTimeMs": 100
    },
    "provider": "mock"
  }
}
```

Jika `GEMINI_API_KEY` kosong, `provider` akan bernilai `mock`.

## 9. Continue Chat

Request:

```txt
POST {{base_url}}/api/chat/message
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```json
{
  "sessionId": "{{session_id}}",
  "message": "Nozzle check shows missing dots on cyan channel."
}
```

## 10. Chat History

Request:

```txt
GET {{base_url}}/api/chat/history
```

Auth:

```txt
Bearer Token: {{user_token}}
```

## 11. Chat Session Detail

Request:

```txt
GET {{base_url}}/api/chat/sessions/{{session_id}}
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Expected data contains:

```json
{
  "id": "{{session_id}}",
  "messages": [],
  "escalationTickets": []
}
```

## 12. Upload Defect Image

Request:

```txt
POST {{base_url}}/api/files/upload
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```txt
form-data
key: file
type: File
value: pilih file .jpg, .png, atau .webp
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("image_id", json.data.id);
```

Rules:

```txt
Allowed: image/jpeg, image/png, image/webp
Max size: 5MB
```

## 13. Chat with Uploaded Image

Request:

```txt
POST {{base_url}}/api/chat/message
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```json
{
  "sessionId": "{{session_id}}",
  "message": "Please analyze this defect image and suggest next steps.",
  "imageId": "{{image_id}}"
}
```

## 14. Escalate Ticket

Request:

```txt
POST {{base_url}}/api/tickets/escalate
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```json
{
  "sessionId": "{{session_id}}",
  "priority": "HIGH"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("ticket_id", json.data.id);
```

Expected response contains:

```json
{
  "ticketCode": "TKT-001",
  "status": "OPEN",
  "priority": "HIGH",
  "summary": "Ringkasan Ticket Helpdesk\n\nMasalah utama:\n- ..."
}
```

## 15. Generate Summary Report

Request:

```txt
POST {{base_url}}/api/reports/summary
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```json
{
  "ticketId": "{{ticket_id}}"
}
```

## 16. Send Summary Email

Mailpit development config:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=helpdesk@epson.local
MAILPIT_WEB_URL=http://localhost:8025
```

Jalankan Mailpit:

```bash
docker run --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Buka inbox:

```txt
http://localhost:8025
```

Jika `.env` baru diubah, restart backend sebelum test email.

Request:

```txt
POST {{base_url}}/api/reports/send-email
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```json
{
  "ticketId": "{{ticket_id}}",
  "recipientEmail": "lead@epson.local",
  "subject": "Epson Helpdesk Ticket Summary"
}
```

Expected if SMTP is running:

```json
{
  "success": true,
  "data": {
    "sent": true,
    "emailLog": {
      "status": "SENT"
    },
    "source": {
      "ticketId": "{{ticket_id}}",
      "sessionId": "{{session_id}}"
    },
    "mailpitUrl": "http://localhost:8025"
  }
}
```

Expected if SMTP is not running:

```json
{
  "success": true,
  "data": {
    "sent": false,
    "emailLog": {
      "status": "FAILED"
    },
    "source": {
      "ticketId": "{{ticket_id}}",
      "sessionId": "{{session_id}}"
    },
    "mailpitUrl": "http://localhost:8025"
  }
}
```

Setelah response `sent: true`, email development muncul di Mailpit. UI helpdesk juga memakai `mailpitUrl`, `source.ticketId`, dan `source.sessionId` untuk membuka Mailpit, Email Logs, atau history chat terkait. Mailpit/email dipakai sebagai notifikasi dan arsip; jawaban resmi ke operator dilakukan lewat thread balasan ticket di web.

## 17. Login Admin

Request ini opsional jika `admin_token` sudah dibuat pada langkah 5A.

```txt
POST {{base_url}}/api/auth/login
```

Auth:

```txt
No Auth
```

Body:

```json
{
  "employeeId": "ADM001",
  "password": "Password123!"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("admin_token", json.data.token);
```

## 18. Admin Categories

List category:

```txt
GET {{base_url}}/api/admin/categories
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

Create category:

```txt
POST {{base_url}}/api/admin/categories
```

Body:

```json
{
  "name": "Demo Ink Issue",
  "description": "Category demo untuk masalah tinta, hasil cetak, dan media."
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("category_id", json.data.id);
```

Catatan: dari UI admin, category juga bisa dibuat cepat dari modal dokumen knowledge.

## 19. Admin List Knowledge

Request:

```txt
GET {{base_url}}/api/admin/knowledge
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 20. Admin Create Knowledge

Request:

```txt
POST {{base_url}}/api/admin/knowledge
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

Body:

```json
{
  "title": "Ink Smear Quick Check",
  "source": "Demo SOP",
  "content": "Check platen cleanliness, media curl, head height, and drying time. Capture sample output before escalation.",
  "categoryId": "{{category_id}}"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("knowledge_id", json.data.id);
```

## 21. Admin Update Knowledge

Request:

```txt
PUT {{base_url}}/api/admin/knowledge/{{knowledge_id}}
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

Body:

```json
{
  "title": "Ink Smear Quick Check Updated",
  "content": "Check platen cleanliness, media curl, head height, drying time, and ink contamination. Capture sample output before escalation."
}
```

## 22. Admin Chat Logs

Request:

```txt
GET {{base_url}}/api/admin/chat-logs
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 23. Admin Chat Log Detail

Request:

```txt
GET {{base_url}}/api/admin/chat-logs/{{session_id}}
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 24. Admin Analytics

Request:

```txt
GET {{base_url}}/api/admin/analytics
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

Expected response contains:

```json
{
  "deflectionRate": 0,
  "avgResponseTime": 100,
  "totalQueries": 3,
  "resolutionRate": 0,
  "totalEscalations": 1,
  "totalSessions": 1
}
```

## 25. Admin Top Issues

Request:

```txt
GET {{base_url}}/api/admin/top-issues
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 26. Login Helpdesk

Request:

```txt
POST {{base_url}}/api/auth/login
```

Body:

```json
{
  "employeeId": "HD001",
  "password": "Password123!"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("helpdesk_token", json.data.token);
```

## 27. Helpdesk List Tickets

Request:

```txt
GET {{base_url}}/api/tickets
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

## 28. Helpdesk Ticket Detail

Request:

```txt
GET {{base_url}}/api/tickets/{{ticket_id}}
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

Expected data contains:

```json
{
  "ticketCode": "TKT-001",
  "summary": "Ringkasan Ticket Helpdesk\n\nMasalah utama:\n- ...",
  "comments": [],
  "session": {
    "messages": []
  }
}
```

## 28A. Helpdesk Reply to Operator

Request:

```txt
POST {{base_url}}/api/tickets/{{ticket_id}}/comments
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

Body:

```json
{
  "message": "Lakukan nozzle check, cek alignment, lalu balas ticket ini dengan hasil pengecekan."
}
```

Expected: response ticket berisi `comments[]` dan status otomatis menjadi `IN_PROGRESS` jika sebelumnya masih `OPEN`.

## 29. Helpdesk Update Ticket to In Progress

Request:

```txt
PATCH {{base_url}}/api/tickets/{{ticket_id}}/status
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

Body:

```json
{
  "status": "IN_PROGRESS"
}
```

## 30. Helpdesk Resolve Ticket

Request:

```txt
PATCH {{base_url}}/api/tickets/{{ticket_id}}/status
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

Body:

```json
{
  "status": "RESOLVED"
}
```

## 30A. Operator Confirm Resolution

Jika solusi berhasil:

```txt
PATCH {{base_url}}/api/tickets/my/{{ticket_id}}/resolution
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Body:

```json
{
  "resolved": true,
  "message": "Solusi berhasil setelah alignment ulang."
}
```

Jika kendala masih terjadi, kirim `resolved: false`; status ticket kembali menjadi `IN_PROGRESS`.

## 31. Email Logs

Request:

```txt
GET {{base_url}}/api/email-logs
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

## 32. Logout

Request:

```txt
POST {{base_url}}/api/auth/logout
```

Auth:

```txt
Bearer Token: {{user_token}}
```

## Suggested Postman Collection Structure

```txt
Epson Helpdesk Backend
  01 Health
    Health Check
  02 Auth
    Register User Operator
    Me
    Login Admin
    Login Helpdesk
    Logout
  03 User Dashboard
    Dashboard User
    Popular Issues
    Recent Activity
  04 Chat
    Start Chat
    Continue Chat
    Chat History
    Chat Session Detail
    Chat with Uploaded Image
  05 Files
    Upload Defect Image
    Get File Metadata
    Delete File
  06 Tickets
    Escalate Ticket
    List Tickets
    Ticket Detail
    Update Ticket Status
  07 Reports
    Generate Summary
    Send Email
    Email Logs
  08 Admin
    Account Approval
    List/Create Categories
    List Knowledge
    Create Knowledge
    Update Knowledge
    Delete Knowledge
    Chat Logs
    Analytics
    Top Issues
```

## Demo Checklist

- Health check sukses.
- User operator register dengan status `PENDING`, token tersimpan, lalu admin approve akun.
- Dashboard user terbuka.
- Chat session dibuat dan `session_id` tersimpan.
- AI response tersimpan.
- Upload image berhasil dan `image_id` tersimpan.
- Ticket dibuat dan `ticket_id` tersimpan.
- Summary report multi-section berhasil dibuat.
- Email log tercatat `SENT` atau `FAILED`; jika Mailpit aktif, email muncul di `http://localhost:8025`.
- Admin bisa approve/reject account, membuat category, melihat knowledge, chat logs, analytics, top issues.
- Helpdesk bisa melihat summary, history chat ticket, dan update status ticket.

## Reset Demo Data

Jika ingin mengulang demo dari awal:

```bash
npx prisma migrate reset --force
npx prisma db execute --file prisma/sql/enable_pgvector.sql
npm run prisma:seed
```

Setelah reset, ulangi demo dari register operator dan approval admin.

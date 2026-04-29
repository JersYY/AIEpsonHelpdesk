# Postman Demo: Epson AI Helpdesk Backend

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
| `session_id` | kosong | kosong |
| `image_id` | kosong | kosong |
| `ticket_id` | kosong | kosong |
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

## 4. Login User

Request:

```txt
POST {{base_url}}/api/auth/login
```

Headers:

```txt
Content-Type: application/json
```

Body:

```json
{
  "email": "operator.assembly@epson.local",
  "password": "Password123!"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("user_token", json.data.token);
```

Expected:

```json
{
  "success": true,
  "data": {
    "user": {
      "email": "operator.assembly@epson.local",
      "role": "USER"
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
  "employeeId": "EMP001",
  "name": "Assembly Operator",
  "role": "USER"
}
```

## 6. User Dashboard

Request:

```txt
GET {{base_url}}/api/dashboard/user
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
GET {{base_url}}/api/issues/popular
```

Auth:

```txt
Bearer Token: {{user_token}}
```

Note: saat belum ada chat/ticket, response fallback ke seed `IssueCategory`.

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
  "status": "OPEN",
  "priority": "HIGH",
  "summary": "Summary of recent helpdesk conversation..."
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
    }
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
    }
  }
}
```

## 17. Login Admin

Request:

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
  "email": "admin@epson.local",
  "password": "Password123!"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("admin_token", json.data.token);
```

## 18. Admin List Knowledge

Request:

```txt
GET {{base_url}}/api/admin/knowledge
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 19. Admin Create Knowledge

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
  "categoryId": null
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("knowledge_id", json.data.id);
```

## 20. Admin Update Knowledge

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

## 21. Admin Chat Logs

Request:

```txt
GET {{base_url}}/api/admin/chat-logs
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 22. Admin Chat Log Detail

Request:

```txt
GET {{base_url}}/api/admin/chat-logs/{{session_id}}
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 23. Admin Analytics

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

## 24. Admin Top Issues

Request:

```txt
GET {{base_url}}/api/admin/top-issues
```

Auth:

```txt
Bearer Token: {{admin_token}}
```

## 25. Login Helpdesk

Request:

```txt
POST {{base_url}}/api/auth/login
```

Body:

```json
{
  "email": "helpdesk@epson.local",
  "password": "Password123!"
}
```

Tests tab:

```javascript
const json = pm.response.json();
pm.environment.set("helpdesk_token", json.data.token);
```

## 26. Helpdesk List Tickets

Request:

```txt
GET {{base_url}}/api/tickets
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

## 27. Helpdesk Ticket Detail

Request:

```txt
GET {{base_url}}/api/tickets/{{ticket_id}}
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

## 28. Helpdesk Update Ticket to In Progress

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

## 29. Helpdesk Resolve Ticket

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

## 30. Email Logs

Request:

```txt
GET {{base_url}}/api/email-logs
```

Auth:

```txt
Bearer Token: {{helpdesk_token}}
```

## 31. Logout

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
Epson AI Helpdesk Backend
  01 Health
    Health Check
  02 Auth
    Login User
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
- User login dan token tersimpan ke environment.
- Dashboard user terbuka.
- Chat session dibuat dan `session_id` tersimpan.
- AI response tersimpan.
- Upload image berhasil dan `image_id` tersimpan.
- Ticket dibuat dan `ticket_id` tersimpan.
- Summary report berhasil dibuat.
- Email log tercatat `SENT` atau `FAILED`.
- Admin bisa melihat knowledge, chat logs, analytics, top issues.
- Helpdesk bisa melihat dan update ticket.

## Reset Demo Data

Jika ingin mengulang demo dari awal:

```bash
npx prisma migrate reset --force
npx prisma db execute --file prisma/sql/enable_pgvector.sql
npm run prisma:seed
```

Setelah reset, ulangi demo dari login user.

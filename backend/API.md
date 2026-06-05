# Epson Helpdesk API

## Format Response

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{ "success": false, "error": { "message": "Invalid credentials", "details": null } }
```

Auth header:

```http
Authorization: Bearer <token>
```

Semua endpoint membutuhkan JWT kecuali `POST /api/auth/register`, `POST /api/auth/login`, dan `GET /api/health`.
Login menggunakan `employeeId` dan `password`, bukan email.
Operator hasil register berstatus `PENDING`; akun tersebut bisa login dan membuka `/api/auth/me`, tetapi endpoint protected lain akan mengembalikan `403` sampai admin approve.

## Endpoint List

### Health

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/health` | Public | - |

### Auth / User Session

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ "employeeId": "EMP002", "name": "Production Operator", "email": "operator.production@epson.local", "department": "Assembly", "password": "Password123!" }` |
| POST | `/api/auth/login` | Public | `{ "employeeId": "ADM001", "password": "Password123!" }` |
| POST | `/api/auth/logout` | JWT | - |
| GET | `/api/auth/me` | JWT | - |

Catatan: register publik selalu membuat role `USER` dengan `accountStatus: PENDING`. Akun `ADMIN` dan `HELPDESK` tidak dibuat dari register publik.

### Dashboard / IssueCategory / Activity

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/dashboard` | JWT | - |
| GET | `/api/dashboard/popular-issues` | JWT | - |
| GET | `/api/dashboard/recent-activity` | JWT | - |

Catatan: `popular-issues` menghitung `ChatSession` non-temporary/non-deleted dan `EscalationTicket` per kategori dalam window 30 hari terakhir. Jika belum ada aktivitas, endpoint mengembalikan fallback seed `IssueCategory` dengan `count: 0`.

### ChatSession / ChatMessage

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/chat/message` | JWT | `{ "message": "Print output has banding", "sessionId": null, "categoryId": null, "imageId": null, "temporary": false }` |
| GET | `/api/chat/history` | JWT | - |
| GET | `/api/chat/sessions/:id` | JWT | - |
| PATCH | `/api/chat/sessions/:id` | JWT | `{ "title": "Printer network issue" }` |
| DELETE | `/api/chat/sessions/:id` | JWT | - |
| POST | `/api/chat/sessions/:id/archive` | JWT | - |
| POST | `/api/chat/sessions/:id/restore` | JWT | - |
| PATCH | `/api/chat/messages/:id` | JWT | `{ "message": "Updated user message" }` |
| POST | `/api/chat/messages/:id/regenerate` | JWT | - |
| POST | `/api/chat/messages/:id/feedback` | JWT | `{ "rating": "UP", "comment": "optional" }` |

### UploadedFile

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/files/upload` | JWT | multipart field `file` |
| GET | `/api/files/:id` | JWT | - |
| DELETE | `/api/files/:id` | JWT | - |

### Admin IssueCategory

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/admin/categories` | ADMIN | - |
| POST | `/api/admin/categories` | ADMIN | `{ "name": "Network Issue", "description": "IP, gateway, DNS, queue, and discovery issues." }` |
| PATCH | `/api/admin/categories/:id` | ADMIN | `{ "name": "Updated Category", "description": "Updated description" }` |
| DELETE | `/api/admin/categories/:id` | ADMIN | - |

Catatan: delete category akan ditolak `409` jika masih dipakai chat session, knowledge document, escalation ticket, atau learning candidate.

### KnowledgeDocument / KnowledgeChunk / SuggestedQuestion

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/admin/knowledge` | ADMIN | - |
| POST | `/api/admin/knowledge` | ADMIN | `{ "title": "Nozzle Check SOP", "source": "SOP", "content": "Steps...", "categoryId": null }` |
| PUT | `/api/admin/knowledge/:id` | ADMIN | `{ "title": "Updated title", "content": "Updated content" }` |
| DELETE | `/api/admin/knowledge/:id` | ADMIN | - |

### Admin Chat Logs

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/admin/chat-logs` | ADMIN | - |
| GET | `/api/admin/chat-logs/:id` | ADMIN | - |

### Admin Analytics / Top Issues

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/admin/analytics` | ADMIN | - |
| GET | `/api/admin/top-issues` | ADMIN | - |

### Admin Account Approval

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/admin/accounts?status=PENDING` | ADMIN | - |
| PATCH | `/api/admin/accounts/:id/status` | ADMIN | `{ "status": "ACTIVE", "reviewNote": "Verified by admin" }` |

Catatan: status patch hanya menerima `ACTIVE` atau `REJECTED`, dan hanya akun role `USER` yang bisa direview.

### EscalationTicket

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/tickets/escalate` | JWT USER/ADMIN/HELPDESK | `{ "sessionId": "uuid", "priority": "MEDIUM", "categoryId": null }` |
| GET | `/api/tickets/my` | USER | - |
| GET | `/api/tickets/my/:id` | USER | - |
| GET | `/api/tickets` | ADMIN/HELPDESK | - |
| GET | `/api/tickets/:id` | ADMIN/HELPDESK | - |
| PATCH | `/api/tickets/:id/status` | ADMIN/HELPDESK | `{ "status": "IN_PROGRESS" }` |

Catatan: `GET /api/tickets/:id` untuk helpdesk/admin menyertakan `session.messages[]` read-only. Field `summary` di response memakai format multi-section terbaru.

### Reports / EmailLog

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/reports/summary` | JWT | `{ "sessionId": "uuid" }` or `{ "ticketId": "uuid" }` |
| POST | `/api/reports/send-email` | JWT | `{ "ticketId": "uuid", "recipientEmail": "lead@epson.local", "subject": "Summary", "summary": "optional edited text" }` |
| GET | `/api/email-logs` | ADMIN/HELPDESK | - |

Catatan: `send-email` mengembalikan `source: { ticketId, sessionId }` dan `mailpitUrl` jika `MAILPIT_WEB_URL` tersedia. `GET /api/email-logs` mendukung query `status` dan `ticketId`.

## Request/Response Examples

### Register Operator

```http
POST /api/auth/register
```

```json
{
  "employeeId": "EMP002",
  "name": "Production Operator",
  "email": "operator.production@epson.local",
  "department": "Assembly",
  "password": "Password123!"
}
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "employeeId": "EMP002",
      "name": "Production Operator",
      "email": "operator.production@epson.local",
      "role": "USER",
      "accountStatus": "PENDING",
      "department": "Assembly"
    },
    "token": "jwt-token"
  }
}
```

### Send Chat Message

```http
POST /api/chat/message
Authorization: Bearer <token>
```

```json
{
  "message": "Printer output has missing dots after maintenance",
  "categoryId": "uuid"
}
```

```json
{
  "success": true,
  "data": {
    "session": { "id": "uuid", "title": "Printer output has missing dots after maintenance", "status": "ACTIVE" },
    "userMessage": { "sender": "USER", "messageText": "Printer output has missing dots after maintenance" },
    "aiMessage": { "sender": "AI", "confidenceScore": 0.82, "knowledgeGrounded": false, "responseTimeMs": 210 },
    "contexts": [],
    "provider": "mock"
  }
}
```

### Approve Operator Account

```http
GET /api/admin/accounts?status=PENDING
Authorization: Bearer <admin-token>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "EMP002",
      "name": "Production Operator",
      "role": "USER",
      "accountStatus": "PENDING"
    }
  ]
}
```

```http
PATCH /api/admin/accounts/uuid/status
Authorization: Bearer <admin-token>
```

```json
{
  "status": "ACTIVE",
  "reviewNote": "Verified by admin"
}
```

### Upload File

```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form field: `file`.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalName": "defect.png",
    "mimeType": "image/png",
    "size": 123456
  }
}
```

### Create Knowledge Document

Category bisa dibuat dulu lewat `/api/admin/categories`, lalu `categoryId` dipakai saat membuat dokumen.

```json
{
  "title": "Print Alignment Recovery",
  "source": "Internal SOP",
  "content": "Run alignment check, inspect media path, then retry sample output.",
  "categoryId": "uuid"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Print Alignment Recovery",
    "chunks": [
      { "id": "uuid", "chunkText": "Run alignment check, inspect media path, then retry sample output." }
    ]
  }
}
```

### Escalate Ticket

```json
{
  "sessionId": "uuid",
  "priority": "HIGH",
  "categoryId": "uuid"
}
```

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketCode": "TKT-001",
    "status": "OPEN",
    "priority": "HIGH",
    "summary": "Ringkasan Ticket Helpdesk\n\nMasalah utama:\n- ..."
  }
}
```

### Ticket Detail

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketCode": "TKT-001",
    "summary": "Ringkasan Ticket Helpdesk\n\nMasalah utama:\n- ...",
    "session": {
      "id": "uuid",
      "messages": [
        { "id": "uuid", "sender": "USER", "messageText": "Printer tidak terdeteksi jaringan" },
        { "id": "uuid", "sender": "AI", "messageText": "Cek koneksi fisik dan konfigurasi IP." }
      ]
    }
  }
}
```

### Send Email

```json
{
  "success": true,
  "data": {
    "sent": true,
    "emailLog": { "status": "SENT" },
    "summary": "Ringkasan Ticket Helpdesk\n\nMasalah utama:\n- ...",
    "source": {
      "ticketId": "uuid",
      "sessionId": "uuid"
    },
    "mailpitUrl": "http://localhost:8025",
    "attachments": []
  }
}
```

### Analytics

```json
{
  "success": true,
  "data": {
    "deflectionRate": 0.75,
    "avgResponseTime": 240,
    "totalQueries": 120,
    "resolutionRate": 0.68,
    "totalEscalations": 16,
    "totalSessions": 80
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to access this resource",
    "details": { "roles": ["ADMIN"] }
  }
}
```

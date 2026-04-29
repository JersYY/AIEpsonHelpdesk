# Epson AI Helpdesk API

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

Semua endpoint membutuhkan JWT kecuali `POST /api/auth/login` dan `GET /api/health`.

## Endpoint List

### Health

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/health` | Public | - |

### Auth / User Session

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/auth/login` | Public | `{ "email": "admin@epson.local", "password": "Password123!" }` |
| POST | `/api/auth/logout` | JWT | - |
| GET | `/api/auth/me` | JWT | - |

### Dashboard / IssueCategory / Activity

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| GET | `/api/dashboard/user` | JWT | - |
| GET | `/api/issues/popular` | JWT | - |
| GET | `/api/activity/recent` | JWT | - |

### ChatSession / ChatMessage

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/chat/message` | JWT | `{ "message": "Print output has banding", "sessionId": null, "categoryId": null, "imageId": null }` |
| GET | `/api/chat/history` | JWT | - |
| GET | `/api/chat/sessions/:id` | JWT | - |

### UploadedFile

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/files/upload` | JWT | multipart field `file` |
| GET | `/api/files/:id` | JWT | - |
| DELETE | `/api/files/:id` | JWT | - |

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

### EscalationTicket

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/tickets/escalate` | JWT USER/ADMIN/HELPDESK | `{ "sessionId": "uuid", "priority": "MEDIUM", "categoryId": null }` |
| GET | `/api/tickets` | ADMIN/HELPDESK | - |
| GET | `/api/tickets/:id` | ADMIN/HELPDESK | - |
| PATCH | `/api/tickets/:id/status` | ADMIN/HELPDESK | `{ "status": "IN_PROGRESS" }` |

### Reports / EmailLog

| Method | Route | Auth/Role | Body |
|---|---|---|---|
| POST | `/api/reports/summary` | JWT | `{ "sessionId": "uuid" }` or `{ "ticketId": "uuid" }` |
| POST | `/api/reports/send-email` | JWT | `{ "ticketId": "uuid", "recipientEmail": "lead@epson.local", "subject": "Summary" }` |
| GET | `/api/email-logs` | ADMIN/HELPDESK | - |

## Request/Response Examples

### Login

```http
POST /api/auth/login
```

```json
{
  "email": "operator.assembly@epson.local",
  "password": "Password123!"
}
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "employeeId": "EMP001",
      "name": "Assembly Operator",
      "email": "operator.assembly@epson.local",
      "role": "USER",
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
    "aiMessage": { "sender": "AI", "confidenceScore": 0.82, "responseTimeMs": 210 },
    "contexts": [],
    "provider": "mock"
  }
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
    "status": "OPEN",
    "priority": "HIGH",
    "summary": "Summary of recent helpdesk conversation..."
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

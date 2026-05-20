export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Epson AI Helpdesk API",
    version: "1.0.0",
    description:
      "OpenAPI documentation for Epson AI Helpdesk backend. Login with employeeId and use the returned JWT as Bearer token for protected endpoints.",
  },
  servers: [
    {
      url: "/api",
      description: "Current backend API",
    },
    {
      url: "http://localhost:4000/api",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Dashboard" },
    { name: "Chat" },
    { name: "Files" },
    { name: "Knowledge" },
    { name: "Admin" },
    { name: "Tickets" },
    { name: "Reports" },
    { name: "Email Logs" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              message: { type: "string", example: "Invalid credentials" },
              details: { nullable: true },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          employeeId: { type: "string", example: "EMP001" },
          name: { type: "string", example: "Assembly Operator" },
          email: { type: "string", format: "email", example: "operator.assembly@epson.local" },
          role: { type: "string", enum: ["USER", "ADMIN", "HELPDESK"] },
          department: { type: "string", nullable: true, example: "Assembly" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      IssueCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Print Quality Issue" },
          description: { type: "string", nullable: true },
          count: { type: "integer", example: 3 },
        },
      },
      ChatSession: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid", nullable: true },
          title: { type: "string", example: "Print quality issue" },
          status: { type: "string", enum: ["ACTIVE", "RESOLVED", "ESCALATED"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ChatMessage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sessionId: { type: "string", format: "uuid" },
          sender: { type: "string", enum: ["USER", "AI", "SYSTEM"] },
          messageText: { type: "string" },
          imageId: { type: "string", format: "uuid", nullable: true },
          confidenceScore: { type: "number", nullable: true, example: 0.82 },
          responseTimeMs: { type: "integer", nullable: true, example: 920 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UploadedFile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          originalName: { type: "string", example: "defect.png" },
          storedName: { type: "string" },
          mimeType: { type: "string", example: "image/png" },
          size: { type: "integer", example: 123456 },
          storagePath: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      KnowledgeDocument: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid", nullable: true },
          title: { type: "string", example: "Print Quality Banding Troubleshooting" },
          source: { type: "string", nullable: true, example: "Internal SOP PQ-001" },
          content: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      KnowledgeChunkContext: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          documentId: { type: "string", format: "uuid" },
          chunkText: { type: "string" },
          documentTitle: { type: "string" },
          source: { type: "string", nullable: true },
          score: { type: "number", nullable: true },
          retrievalMode: { type: "string", enum: ["semantic", "keyword", "recent"] },
        },
      },
      EscalationTicket: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sessionId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid", nullable: true },
          summary: { type: "string" },
          status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EmailLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticketId: { type: "string", format: "uuid", nullable: true },
          recipientEmail: { type: "string", format: "email" },
          subject: { type: "string" },
          status: { type: "string", enum: ["SENT", "FAILED"] },
          sentAt: { type: "string", format: "date-time" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 100 },
          totalPages: { type: "integer", example: 5 },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Authentication token is missing, invalid, or expired.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Authenticated user does not have the required role.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Resource not found.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        security: [],
        responses: {
          200: {
            description: "Backend is running.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    status: "ok",
                    service: "epson-helpdesk-api",
                    timestamp: "2026-05-20T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with employee ID or email",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "password"],
                properties: {
                  employeeId: { type: "string", example: "EMP001" },
                  password: { type: "string", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login success.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current user",
        responses: {
          200: { description: "Logout success." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        responses: {
          200: {
            description: "Current user.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/dashboard/user": {
      get: {
        tags: ["Dashboard"],
        summary: "Get user dashboard",
        responses: {
          200: { description: "Dashboard data with quick actions, popular issues, and recent activity." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/issues/popular": {
      get: {
        tags: ["Dashboard"],
        summary: "Get popular issue categories",
        responses: {
          200: {
            description: "Popular issues.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/IssueCategory" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/activity/recent": {
      get: {
        tags: ["Dashboard"],
        summary: "Get recent activity for current user",
        responses: {
          200: { description: "Recent chat sessions for current user." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/chat/message": {
      post: {
        tags: ["Chat"],
        summary: "Send message to AI Helpdesk",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Printer menghasilkan garis putih pada hasil cetak. Apa langkah awalnya?",
                  },
                  sessionId: { type: "string", format: "uuid", nullable: true },
                  categoryId: { type: "string", format: "uuid", nullable: true },
                  imageId: { type: "string", format: "uuid", nullable: true },
                  title: { type: "string", nullable: true, example: "Print quality issue" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Message and AI response created.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        session: { $ref: "#/components/schemas/ChatSession" },
                        userMessage: { $ref: "#/components/schemas/ChatMessage" },
                        aiMessage: { $ref: "#/components/schemas/ChatMessage" },
                        contexts: {
                          type: "array",
                          items: { $ref: "#/components/schemas/KnowledgeChunkContext" },
                        },
                        provider: { type: "string", enum: ["gemini", "mock"] },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/chat/history": {
      get: {
        tags: ["Chat"],
        summary: "Get chat history",
        responses: {
          200: { description: "Chat session list." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/chat/sessions/{id}": {
      get: {
        tags: ["Chat"],
        summary: "Get chat session detail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Chat session detail." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/files/upload": {
      post: {
        tags: ["Files"],
        summary: "Upload defect image",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "JPEG, PNG, or WEBP image. Max 5MB.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Uploaded file metadata.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/UploadedFile" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/files/{id}": {
      get: {
        tags: ["Files"],
        summary: "Get uploaded file metadata",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "File metadata." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Files"],
        summary: "Delete uploaded file",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "File deleted." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/admin/knowledge": {
      get: {
        tags: ["Knowledge"],
        summary: "List knowledge documents",
        description: "Requires ADMIN role.",
        parameters: [{ name: "categoryId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Knowledge document list." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Knowledge"],
        summary: "Create knowledge document",
        description: "Requires ADMIN role. Backend automatically chunks content and tries to create embeddings.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content"],
                properties: {
                  title: { type: "string", example: "Nozzle Check Troubleshooting" },
                  source: { type: "string", nullable: true, example: "Internal SOP" },
                  content: { type: "string", example: "Jika hasil cetak bergaris, lakukan nozzle check..." },
                  categoryId: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Knowledge document created." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/knowledge/{id}": {
      put: {
        tags: ["Knowledge"],
        summary: "Update knowledge document",
        description: "Requires ADMIN role.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KnowledgeDocument" },
            },
          },
        },
        responses: {
          200: { description: "Knowledge document updated." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Knowledge"],
        summary: "Delete knowledge document",
        description: "Requires ADMIN role.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Knowledge document deleted." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/admin/chat-logs": {
      get: {
        tags: ["Admin"],
        summary: "List chat logs",
        description: "Requires ADMIN role.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "userId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "RESOLVED", "ESCALATED"] } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Paginated chat logs." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/chat-logs/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get chat log detail",
        description: "Requires ADMIN role.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Chat log detail." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/admin/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Get admin analytics",
        description: "Requires ADMIN role.",
        responses: {
          200: { description: "Analytics metrics." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/top-issues": {
      get: {
        tags: ["Admin"],
        summary: "Get top issue categories",
        description: "Requires ADMIN role.",
        responses: {
          200: { description: "Top issue categories." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/tickets/escalate": {
      post: {
        tags: ["Tickets"],
        summary: "Create escalation ticket from chat session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sessionId"],
                properties: {
                  sessionId: { type: "string", format: "uuid" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
                  categoryId: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Escalation ticket created." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "List escalation tickets",
        description: "Requires ADMIN or HELPDESK role.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Paginated ticket list." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/tickets/{id}": {
      get: {
        tags: ["Tickets"],
        summary: "Get escalation ticket detail",
        description: "Requires ADMIN or HELPDESK role.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Ticket detail." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/tickets/{id}/status": {
      patch: {
        tags: ["Tickets"],
        summary: "Update escalation ticket status",
        description: "Requires ADMIN or HELPDESK role.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Ticket status updated." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/reports/summary": {
      post: {
        tags: ["Reports"],
        summary: "Generate summary from session or ticket",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sessionId: { type: "string", format: "uuid" },
                  ticketId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Summary generated." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/reports/send-email": {
      post: {
        tags: ["Reports"],
        summary: "Send summary report email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["recipientEmail"],
                properties: {
                  sessionId: { type: "string", format: "uuid" },
                  ticketId: { type: "string", format: "uuid" },
                  recipientEmail: { type: "string", format: "email", example: "helpdesk@epson.local" },
                  subject: { type: "string", example: "Epson AI Helpdesk Summary Report" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Email send result and EmailLog." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/email-logs": {
      get: {
        tags: ["Email Logs"],
        summary: "List email logs",
        description: "Requires ADMIN or HELPDESK role.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["SENT", "FAILED"] } },
          { name: "ticketId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Paginated email logs." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

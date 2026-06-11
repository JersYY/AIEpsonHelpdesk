export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Epson Helpdesk API",
    version: "1.0.0",
    description:
      "OpenAPI documentation for Epson Helpdesk backend. Operators can register as USER, then wait for admin approval before using protected helpdesk features.",
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
    { name: "Categories" },
    { name: "Admin" },
    { name: "Tickets" },
    { name: "Reports" },
    { name: "Email Logs" },
    { name: "Users" },
    { name: "Learning" },
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
          employeeId: { type: "string", example: "EMP002" },
          name: { type: "string", example: "Production Operator" },
          email: { type: "string", format: "email", example: "operator.production@epson.local" },
          role: { type: "string", enum: ["USER", "ADMIN", "HELPDESK"] },
          accountStatus: { type: "string", enum: ["PENDING", "ACTIVE", "REJECTED"], example: "ACTIVE" },
          department: { type: "string", nullable: true, example: "Assembly" },
          approvedAt: { type: "string", format: "date-time", nullable: true },
          rejectedAt: { type: "string", format: "date-time", nullable: true },
          reviewNote: { type: "string", nullable: true },
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
          usage: {
            type: "object",
            nullable: true,
            properties: {
              chatSessions: { type: "integer", example: 2 },
              knowledgeDocuments: { type: "integer", example: 1 },
              escalationTickets: { type: "integer", example: 0 },
              knowledgeCandidates: { type: "integer", example: 0 },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
          archived: { type: "boolean", example: false },
          isTemporary: { type: "boolean", example: false },
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
          knowledgeGrounded: {
            type: "boolean",
            nullable: true,
            description: "Present on freshly generated AI responses; false means the answer was not grounded by a knowledge base context.",
          },
          responseTimeMs: { type: "integer", nullable: true, example: 920 },
          feedback: { type: "string", enum: ["UP", "DOWN"], nullable: true },
          editedAt: { type: "string", format: "date-time", nullable: true },
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
          ticketNumber: { type: "integer", example: 1 },
          ticketCode: { type: "string", example: "TKT-001" },
          sessionId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid", nullable: true },
          summary: { type: "string" },
          status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          user: { $ref: "#/components/schemas/User" },
          session: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string", example: "Printer tidak terdeteksi jaringan" },
              status: { type: "string", enum: ["ACTIVE", "RESOLVED", "ESCALATED"] },
              messages: {
                type: "array",
                description: "Read-only chat history included on admin/helpdesk ticket detail.",
                items: { $ref: "#/components/schemas/ChatMessage" },
              },
            },
          },
          category: { $ref: "#/components/schemas/IssueCategory" },
          comments: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketComment" },
          },
          emailLogs: {
            type: "array",
            items: { $ref: "#/components/schemas/EmailLog" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TicketComment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticketId: { type: "string", format: "uuid" },
          authorId: { type: "string", format: "uuid" },
          message: {
            type: "string",
            example: "Lakukan nozzle check, cek alignment, lalu balas ticket ini dengan hasil pengecekan.",
          },
          author: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              employeeId: { type: "string", example: "HD001" },
              name: { type: "string", example: "Helpdesk Agent" },
              role: { type: "string", enum: ["USER", "ADMIN", "HELPDESK"] },
              department: { type: "string", nullable: true, example: "Helpdesk" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TicketCommentRequest: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            maxLength: 4000,
            example: "Solusi sudah dicoba, hasil nozzle check masih menunjukkan garis pada warna cyan.",
          },
        },
      },
      TicketResolutionRequest: {
        type: "object",
        required: ["resolved"],
        properties: {
          resolved: {
            type: "boolean",
            example: true,
            description: "true closes the ticket; false returns it to IN_PROGRESS.",
          },
          message: {
            type: "string",
            maxLength: 4000,
            nullable: true,
            example: "Solusi berhasil setelah alignment ulang.",
          },
        },
      },
      TicketResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/EscalationTicket" },
        },
      },
      ReportSource: {
        type: "object",
        properties: {
          ticketId: { type: "string", format: "uuid", nullable: true },
          sessionId: { type: "string", format: "uuid", nullable: true },
        },
      },
      ReportAttachment: {
        type: "object",
        properties: {
          filename: { type: "string", example: "defect.png" },
          contentType: { type: "string", example: "image/png" },
        },
      },
      ReportSummaryResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                example: "Ringkasan Ticket Helpdesk\n\nMasalah utama:\n- Printer tidak terdeteksi jaringan.",
              },
              source: { $ref: "#/components/schemas/ReportSource" },
              attachments: {
                type: "array",
                items: { $ref: "#/components/schemas/ReportAttachment" },
              },
            },
          },
        },
      },
      SendEmailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              sent: { type: "boolean", example: true },
              emailLog: { $ref: "#/components/schemas/EmailLog" },
              summary: { type: "string" },
              source: { $ref: "#/components/schemas/ReportSource" },
              mailpitUrl: { type: "string", nullable: true, example: "http://localhost:8025" },
              attachments: {
                type: "array",
                items: { $ref: "#/components/schemas/ReportAttachment" },
              },
              error: { type: "string", nullable: true, example: "connect ECONNREFUSED 127.0.0.1:1025" },
            },
          },
        },
      },
      KnowledgeCandidate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sourceSessionId: { type: "string", format: "uuid", nullable: true },
          createdByUserId: { type: "string", format: "uuid", nullable: true },
          title: { type: "string" },
          content: { type: "string" },
          categoryId: { type: "string", format: "uuid", nullable: true },
          status: { type: "string", enum: ["PENDING", "NEEDS_EDIT", "APPROVED", "REJECTED"] },
          confidenceScore: { type: "number", nullable: true },
          redactionStatus: { type: "string", enum: ["PENDING", "REDACTED"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UserPreferences: {
        type: "object",
        properties: {
          theme: { type: "string", enum: ["light", "dark", "system"] },
          defaultChatMode: { type: "string", enum: ["normal", "temporary"] },
          compactSidebar: { type: "boolean" },
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
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register operator account",
        description: "Public registration for operator accounts only. Backend always creates role USER with accountStatus PENDING; ADMIN and HELPDESK accounts are managed by seed/database/admin process.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "name", "email", "password"],
                properties: {
                  employeeId: { type: "string", example: "EMP002" },
                  name: { type: "string", example: "Production Operator" },
                  email: { type: "string", format: "email", example: "operator.production@epson.local" },
                  department: { type: "string", nullable: true, example: "Assembly" },
                  password: { type: "string", minLength: 8, example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Operator registered with PENDING approval status and authenticated for the locked pending page.",
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
          400: { description: "Validation failed." },
          409: { description: "Employee ID or email already registered." },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with employee ID",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "password"],
                properties: {
                  employeeId: { type: "string", example: "ADM001" },
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
    "/auth/password": {
      patch: {
        tags: ["Auth"],
        summary: "Change current user password",
        description: "Update password for the authenticated user. Requires the current password and matching new password confirmation.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword", "confirmPassword"],
                properties: {
                  currentPassword: { type: "string", example: "Password123!" },
                  newPassword: { type: "string", minLength: 8, example: "NewPassword123!" },
                  confirmPassword: { type: "string", minLength: 8, example: "NewPassword123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated successfully.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    message: "Password updated successfully",
                  },
                },
              },
            },
          },
          400: { description: "Validation failed or current password is incorrect." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get user dashboard",
        responses: {
          200: { description: "Dashboard data with quick actions, popular issues, and recent activity." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/dashboard/popular-issues": {
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
    "/dashboard/recent-activity": {
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
                  temporary: {
                    type: "boolean",
                    default: false,
                    description: "When true, the message is answered but NOT persisted, NOT in history, and NOT used for self-learning.",
                  },
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
                        provider: { type: "string", enum: ["deepseek", "gemini_vision", "mock"] },
                        aiMode: { type: "string", enum: ["hemat", "normal"] },
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
        parameters: [
          {
            name: "archived",
            in: "query",
            required: false,
            schema: { type: "boolean" },
            description: "If true, returns only archived chat sessions. Default is false (active sessions only)."
          }
        ],
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
      patch: {
        tags: ["Chat"],
        summary: "Rename a chat session",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: { title: { type: "string", example: "Printer banding after maintenance" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Session renamed." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Chat"],
        summary: "Soft-delete a chat session",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Session deleted." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/chat/sessions/{id}/archive": {
      post: {
        tags: ["Chat"],
        summary: "Archive a chat session",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Session archived." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/chat/sessions/{id}/restore": {
      post: {
        tags: ["Chat"],
        summary: "Restore an archived chat session",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Session restored." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/chat/messages/{id}": {
      patch: {
        tags: ["Chat"],
        summary: "Edit a user message and regenerate the AI answer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: { message: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Message edited and new answer generated." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/chat/messages/{id}/regenerate": {
      post: {
        tags: ["Chat"],
        summary: "Regenerate an AI answer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "New AI answer generated." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/chat/messages/{id}/feedback": {
      post: {
        tags: ["Chat"],
        summary: "Submit feedback on an AI answer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "string", enum: ["UP", "DOWN"] },
                  comment: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Feedback recorded." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/knowledge": {
      get: {
        tags: ["Knowledge"],
        summary: "List knowledge documents (read-only, all roles)",
        parameters: [{ name: "categoryId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: {
            description: "Knowledge document list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/KnowledgeDocument" } },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/knowledge/suggested-questions": {
      get: {
        tags: ["Knowledge"],
        summary: "List suggested questions for quick prompts",
        responses: {
          200: { description: "Suggested questions." },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/knowledge/{id}": {
      get: {
        tags: ["Knowledge"],
        summary: "Get knowledge document detail (read-only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Knowledge document detail." },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/users/me/preferences": {
      get: {
        tags: ["Users"],
        summary: "Get current user preferences",
        responses: {
          200: {
            description: "User preferences.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/UserPreferences" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user preferences",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserPreferences" },
            },
          },
        },
        responses: {
          200: { description: "Preferences updated." },
          401: { $ref: "#/components/responses/Unauthorized" },
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
    "/admin/categories": {
      get: {
        tags: ["Categories"],
        summary: "List issue categories",
        description: "Requires ADMIN role. Used by the Knowledge Base category tab and document form.",
        responses: {
          200: {
            description: "Issue category list with usage counters.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/IssueCategory" } },
                  },
                },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create issue category",
        description: "Requires ADMIN role. Category name must be unique, case-insensitive.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Network Issue" },
                  description: { type: "string", nullable: true, example: "Printer discovery, IP, gateway, DNS, and queue issues." },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Issue category created." },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { description: "Category name already exists." },
        },
      },
    },
    "/admin/categories/{id}": {
      patch: {
        tags: ["Categories"],
        summary: "Update issue category",
        description: "Requires ADMIN role. Supports partial updates.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Network Issue" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Issue category updated." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { description: "Category name already exists." },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete issue category",
        description: "Requires ADMIN role. Delete is blocked when category is still used by chat sessions, knowledge documents, escalation tickets, or learning candidates.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Issue category deleted." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { description: "Category is still used." },
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
    "/admin/ai-settings": {
      get: {
        tags: ["Admin"],
        summary: "Get AI runtime settings",
        description: "Requires ADMIN role. Returns DeepSeek runtime mode and keyword RAG status.",
        responses: {
          200: { description: "AI settings." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      patch: {
        tags: ["Admin"],
        summary: "Update AI response mode",
        description: "Requires ADMIN role. Provider routing is automatic: text/RAG uses DeepSeek, image attachments use Gemini Vision. Mode hemat limits output tokens/retries; normal allows a more complete answer.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  mode: { type: "string", enum: ["hemat", "normal"], example: "hemat" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "AI settings updated." },
          400: { description: "Invalid mode." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/accounts": {
      get: {
        tags: ["Admin"],
        summary: "List operator accounts for approval",
        description: "Requires ADMIN role. Returns USER accounts filtered by approval status.",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["PENDING", "ACTIVE", "REJECTED", "ALL"], default: "PENDING" },
          },
        ],
        responses: {
          200: {
            description: "Operator account list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/accounts/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Approve or reject an operator account",
        description: "Requires ADMIN role. Only USER accounts can be reviewed.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "REJECTED"], example: "ACTIVE" },
                  reviewNote: { type: "string", nullable: true, example: "Verified by HR/admin." },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Operator account status updated." },
          400: { description: "Invalid status." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/admin/ml/status": {
      get: {
        tags: ["Admin"],
        summary: "Get local ML model status",
        description: "Requires ADMIN role. Returns model versions, metrics, and accumulated training example counts.",
        responses: {
          200: {
            description: "ML model status.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        models: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string", example: "category-classifier" },
                              version: { type: "integer", example: 1 },
                              sampleCount: { type: "integer", example: 42 },
                              metrics: { type: "object", nullable: true },
                              trainedAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                        accumulatedExamples: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              task: { type: "string", example: "category" },
                              count: { type: "integer", example: 8 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/ml/train": {
      post: {
        tags: ["Admin"],
        summary: "Retrain local ML classifiers",
        description: "Requires ADMIN role. Retrains category, intent, and priority classifiers from seed examples plus accumulated examples.",
        responses: {
          200: { description: "Training result for category, intent, and priority models." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/ml/predict": {
      post: {
        tags: ["Admin"],
        summary: "Run debug ML prediction",
        description: "Requires ADMIN role. Runs intent, category, priority, and escalation predictors for the given text.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: {
                    type: "string",
                    example: "Printer tidak terdeteksi di jaringan produksi setelah pindah subnet.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Prediction result.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        intent: { type: "object" },
                        category: { type: "object" },
                        priority: { type: "object" },
                        escalation: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "text is required." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/admin/ml/learn-ticket/{id}": {
      post: {
        tags: ["Admin"],
        summary: "Create learning output from a resolved ticket",
        description: "Requires ADMIN role. Converts a resolved ticket into learning/knowledge output when eligible.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Learning output created from ticket." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
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
          201: {
            description: "Escalation ticket created.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
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
          { name: "q", in: "query", schema: { type: "string" }, description: "Search summary or user." },
        ],
        responses: {
          200: {
            description: "Paginated ticket list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        items: { type: "array", items: { $ref: "#/components/schemas/EscalationTicket" } },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/tickets/my": {
      get: {
        tags: ["Tickets"],
        summary: "List current user's tickets",
        description: "Requires USER role.",
        responses: {
          200: {
            description: "Current user's tickets.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/EscalationTicket" } },
                  },
                },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/tickets/my/{id}": {
      get: {
        tags: ["Tickets"],
        summary: "Get current user's ticket detail",
        description: "Requires USER role. Only returns tickets owned by the user.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: {
            description: "Ticket detail.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/tickets/my/{id}/comments": {
      post: {
        tags: ["Tickets"],
        summary: "Reply to current user's ticket",
        description: "Requires USER role. Operator can add follow-up information only to their own ticket.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TicketCommentRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Comment created and updated ticket returned.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
          400: { description: "Message is required or too long." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/tickets/my/{id}/resolution": {
      patch: {
        tags: ["Tickets"],
        summary: "Confirm ticket resolution as operator",
        description:
          "Requires USER role. Use resolved=true when the helpdesk solution works; use resolved=false when the issue still needs follow-up.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TicketResolutionRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Resolution confirmation saved and updated ticket returned.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
          400: { description: "resolved must be true or false." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
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
          200: {
            description: "Ticket detail with read-only session.messages and comments thread.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/tickets/{id}/comments": {
      post: {
        tags: ["Tickets"],
        summary: "Reply to a ticket as helpdesk or admin",
        description:
          "Requires ADMIN or HELPDESK role. Adds a web-based reply for the operator. If the ticket is OPEN, it becomes IN_PROGRESS.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TicketCommentRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Comment created and updated ticket returned.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
          400: { description: "Message is required or too long." },
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
          200: {
            description: "Ticket status updated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketResponse" },
              },
            },
          },
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
          200: {
            description: "Summary generated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReportSummaryResponse" },
              },
            },
          },
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
                  summary: {
                    type: "string",
                    nullable: true,
                    description: "Optional edited summary text. Backend generates one from sessionId/ticketId if omitted.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Email send result, EmailLog, source ids, optional Mailpit URL, and attachment metadata.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SendEmailResponse" },
              },
            },
          },
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
    "/learning/candidates": {
      get: {
        tags: ["Learning"],
        summary: "List self-learning knowledge candidates",
        description: "Requires ADMIN or HELPDESK role.",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "NEEDS_EDIT", "APPROVED", "REJECTED"] } },
        ],
        responses: {
          200: {
            description: "Candidate list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/KnowledgeCandidate" } },
                  },
                },
              },
            },
          },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/learning/candidates/from-session/{sessionId}": {
      post: {
        tags: ["Learning"],
        summary: "Create a knowledge candidate from a validated session",
        description: "Requires ADMIN or HELPDESK role. Temporary sessions are rejected.",
        parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          201: { description: "Candidate created (or skipped if not eligible)." },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/learning/candidates/{id}": {
      get: {
        tags: ["Learning"],
        summary: "Get a knowledge candidate",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Candidate detail." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Learning"],
        summary: "Edit a knowledge candidate before approval",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  categoryId: { type: "string", format: "uuid", nullable: true },
                  status: { type: "string", enum: ["PENDING", "NEEDS_EDIT", "APPROVED", "REJECTED"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Candidate updated." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/learning/candidates/{id}/approve": {
      post: {
        tags: ["Learning"],
        summary: "Approve a candidate and create a KnowledgeDocument for RAG",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Candidate approved and knowledge document created." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/learning/candidates/{id}/reject": {
      post: {
        tags: ["Learning"],
        summary: "Reject a candidate",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string", nullable: true } },
              },
            },
          },
        },
        responses: {
          200: { description: "Candidate rejected." },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

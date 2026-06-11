import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { openApiSpec } from "./config/openapi.js";
import { requireActiveAccount } from "./middlewares/account.middleware.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/notfound.middleware.js";
import { authorizeRoles } from "./middlewares/role.middleware.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import categoryRoutes from "./modules/categories/categories.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import { serveUploadedFile } from "./modules/files/files.controller.js";
import fileRoutes from "./modules/files/files.routes.js";
import { localUploadDir } from "./modules/files/storage.service.js";
import healthRoutes from "./modules/health/health.routes.js";
import knowledgeRoutes from "./modules/knowledge/knowledge.routes.js";
import knowledgePublicRoutes from "./modules/knowledge/knowledge.public.routes.js";
import learningRoutes from "./modules/ml/learning.routes.js";
import mlRoutes from "./modules/ml/ml.routes.js";
import emailRoutes from "./modules/reports/email.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import ticketRoutes from "./modules/tickets/tickets.routes.js";
import userRoutes from "./modules/users/user.routes.js";

const app = express();

const configuredCorsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];
const devCorsOrigins = process.env.NODE_ENV === "production"
  ? []
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];
const allowedCorsOrigins = new Set([...configuredCorsOrigins, ...devCorsOrigins]);

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !env.CORS_ORIGIN || allowedCorsOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(localUploadDir()));
app.get("/uploads/:storedName", serveUploadedFile);

app.get("/api/docs.json", (req, res) => {
  res.json(openApiSpec);
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.use("/api", requireAuth);
app.use("/api", requireActiveAccount);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/knowledge", knowledgePublicRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/email-logs", emailRoutes);
app.use("/api/learning", authorizeRoles("ADMIN", "HELPDESK"), learningRoutes);
app.use("/api/admin/categories", authorizeRoles("ADMIN"), categoryRoutes);
app.use("/api/admin/knowledge", authorizeRoles("ADMIN"), knowledgeRoutes);
app.use("/api/admin/ml", authorizeRoles("ADMIN"), mlRoutes);
app.use("/api/admin", authorizeRoles("ADMIN"), adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

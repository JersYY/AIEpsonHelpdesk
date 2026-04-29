import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/notfound.middleware.js";
import { authorizeRoles } from "./middlewares/role.middleware.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import activityRoutes from "./modules/dashboard/activity.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import issuesRoutes from "./modules/dashboard/issues.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import fileRoutes from "./modules/files/files.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import knowledgeRoutes from "./modules/knowledge/knowledge.routes.js";
import emailRoutes from "./modules/reports/email.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import ticketRoutes from "./modules/tickets/tickets.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.use("/api", requireAuth);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/email-logs", emailRoutes);
app.use("/api/admin/knowledge", authorizeRoles("ADMIN"), knowledgeRoutes);
app.use("/api/admin", authorizeRoles("ADMIN"), adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes.js";
import healthRoutes from "./modules/health/health.routes.js";

import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// global middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);

// error handler
app.use(notFound);
app.use(errorHandler);

export default app;

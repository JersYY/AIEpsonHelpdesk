import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "./env.js";

const globalForPrisma = globalThis;
const adapter =
  globalForPrisma.prismaPgAdapter || new PrismaPg(env.DATABASE_URL || "");

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaPgAdapter = adapter;
  globalForPrisma.prisma = prisma;
}

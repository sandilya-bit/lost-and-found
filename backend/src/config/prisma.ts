import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton.
 * In dev, hot-reloaders (tsx watch / nodemon) re-evaluate modules and would
 * otherwise open a new connection pool on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

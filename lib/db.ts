import "server-only";

import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton.
 *
 * The Express codebase called `new PrismaClient()` at the top of nearly every
 * controller, which opened a fresh connection pool per module. Next.js hot
 * reloads modules in dev, so that pattern exhausts Mongo connections fast —
 * hence the global cache.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma — évite d'épuiser le pool de connexions en dev
 * (hot-reload de Next.js recrée les modules à chaque édition).
 *
 * NOTE: nécessite `prisma generate` après configuration de DATABASE_URL.
 * Aucun appel n'est effectué tant que la DB n'est pas connectée.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

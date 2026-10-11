import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string | undefined {
  if (process.env.VERCEL) {
    const bundledDbPath = path.join(process.cwd(), "prisma", "dev.db");
    const tmpDbPath = "/tmp/dev.db";
    if (fs.existsSync(bundledDbPath) && !fs.existsSync(tmpDbPath)) {
      try {
        fs.copyFileSync(bundledDbPath, tmpDbPath);
      } catch (err) {
        console.warn("Warning: Could not copy SQLite database to /tmp:", err);
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      return "file:/tmp/dev.db";
    }
  }
  return process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

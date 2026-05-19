import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const url = `file:${dbPath}`;

console.log("[PRISMA] Database path:", dbPath);
console.log("[PRISMA] Database URL:", url);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  console.log("[PRISMA] Creating new Prisma client with URL:", url);
  try {
    const adapter = new PrismaLibSql({ url });
    console.log("[PRISMA] LibSQL adapter created successfully");
    const client = new PrismaClient({ adapter });
    console.log("[PRISMA] PrismaClient instantiated successfully");
    return client;
  } catch (error) {
    console.error("[PRISMA] Error creating Prisma client:", error);
    throw error;
  }
}

// Always create fresh in dev to avoid stale cache issues
if (process.env.NODE_ENV !== "production") {
  console.log("[PRISMA] Development mode - clearing cached client");
  delete (globalForPrisma as any).prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  console.log("[PRISMA] Client cached for development mode");
}


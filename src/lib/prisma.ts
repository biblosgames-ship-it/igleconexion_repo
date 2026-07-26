import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });
  }

  if (dbUrl.startsWith("file:")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    return new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });
  }

  throw new Error(
    "DATABASE_URL is not set or has an unsupported format. " +
    "Expected postgresql://..., postgres://..., or file:..."
  );
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

if (process.env.NODE_ENV !== "production") {
  // In dev, cache on global so hot-reload doesn't create extra clients
} else {
  // In production, also cache on global (serverless isolation)
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient();
    const val = (client as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

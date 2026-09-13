import { Prisma, PrismaClient } from "@prisma/client";

type PrismaClientSingleton = ReturnType<typeof createPrisma>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientSingleton;
  prismaKeepAlive?: ReturnType<typeof setInterval>;
};

function decoratedDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "15");
    if (url.hostname.includes("-pooler") && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function isTransientDbError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || error.code === "P1017" || error.code === "P2024";
  }
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|Server has closed the connection|kind: Closed|Connection reset|ECONNRESET|ECONNREFUSED|ETIMEDOUT/i.test(
    message,
  );
}

function createPrisma() {
  const datasourceUrl = decoratedDatabaseUrl();
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!isTransientDbError(error)) throw error;
          await base.$disconnect().catch(() => undefined);
          await new Promise((resolve) => setTimeout(resolve, 200));
          await base.$connect();
          return query(args);
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

if (!process.env.NEXT_PHASE && !globalForPrisma.prismaKeepAlive) {
  globalForPrisma.prismaKeepAlive = setInterval(() => {
    void prisma.$queryRaw`SELECT 1`.catch(() => undefined);
  }, 25_000);
  globalForPrisma.prismaKeepAlive.unref?.();
}

export default prisma;

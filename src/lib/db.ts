import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The Neon–Netlify integration injects NETLIFY_DATABASE_URL (pooled).
// Support that, plain DATABASE_URL, or the unpooled fallbacks.
const rawUrl =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
  undefined;

// Neon's pooled endpoint (host contains "-pooler") runs PgBouncer in
// transaction mode. Prisma must disable prepared statements there, or
// queries fail intermittently ("prepared statement already exists"),
// which breaks NextAuth sessions and causes post-login redirect loops.
function normalizeNeonUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.host.includes("-pooler") && !u.searchParams.has("pgbouncer")) {
      u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) {
        u.searchParams.set("connection_limit", "1");
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}

const datasourceUrl = normalizeNeonUrl(rawUrl);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

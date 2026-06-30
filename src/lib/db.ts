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

// On the Cloudflare Workers runtime the native Prisma query engine isn't
// available, so we go through @prisma/adapter-neon + the Neon serverless
// driver. On Node (dev, Netlify, scripts, migrations) we keep the native
// engine — same connection string, no extra hop. Detect Workers via the
// presence of the WebSocket-based runtime that Cloudflare exposes.
function isWorkersRuntime(): boolean {
  // navigator.userAgent on Workers is "Cloudflare-Workers"; checking it is
  // safer than process.env signals which OpenNext sometimes synthesises.
  const ua = (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent;
  return typeof ua === "string" && ua.includes("Cloudflare-Workers");
}

function makeClient(): PrismaClient {
  const baseLog: ("query" | "error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

  if (isWorkersRuntime() && datasourceUrl) {
    // Lazy-require so Node bundles don't pull in the Workers-flavoured
    // websocket transport unnecessarily.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
    const adapter = new PrismaNeon({ connectionString: datasourceUrl });
    return new PrismaClient({ adapter, log: baseLog });
  }

  return new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: baseLog,
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

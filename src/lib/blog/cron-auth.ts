import { NextRequest } from "next/server";

/**
 * Shared-secret check for internal cron endpoints. The Netlify scheduled
 * function forwards CRON_SECRET in the Authorization header. If CRON_SECRET is
 * unset, access is denied (fail closed).
 */
export function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token === secret || header === secret;
}

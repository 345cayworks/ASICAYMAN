/**
 * Bootstrap-admin — idempotent recovery for the SUPERADMIN account.
 *
 * Run locally with the production DATABASE_URL exported:
 *
 *   DATABASE_URL="postgresql://..." \
 *   ADMIN_EMAIL="info@cayworks.com" \
 *   ADMIN_PASSWORD="pick-a-strong-one" \
 *   ADMIN_NAME="Operations" \
 *     npm run admin:bootstrap
 *
 * Behaviour:
 *   - If the email already exists: rotates the password, forces
 *     role=SUPERADMIN and status=ACTIVE so a forgotten / suspended
 *     account can log in again.
 *   - If the email doesn't exist: creates a fresh SUPERADMIN user.
 *   - Either way, an AuditLog row is written.
 *
 * The plaintext password never leaves this process; the script prints
 * what it did but redacts the password back to the caller (they already
 * have it via env).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "Operations").trim();

  if (!email || !password) {
    console.error(
      "✗ ADMIN_EMAIL and ADMIN_PASSWORD must both be set. See header comment.",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("✗ ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL must be exported.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true, name: true },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPERADMIN",
      status: "ACTIVE",
      name: existing?.name ?? name,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
    select: { id: true, email: true, role: true, status: true, name: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorEmail: user.email,
      action: existing ? "ADMIN_PASSWORD_RESET" : "ADMIN_BOOTSTRAP",
      entity: "User",
      details: {
        targetUserId: user.id,
        targetEmail: user.email,
        previousRole: existing?.role ?? null,
        previousStatus: existing?.status ?? null,
      },
    },
  });

  console.log(
    existing
      ? `✔ Rotated password + forced SUPERADMIN/ACTIVE on existing user ${user.email} (id=${user.id}).`
      : `✔ Created new SUPERADMIN user ${user.email} (id=${user.id}).`,
  );
  console.log(
    "  Sign in at /auth/signin with the email + ADMIN_PASSWORD you provided.",
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("✗ bootstrap-admin failed:", err);
  process.exit(1);
});

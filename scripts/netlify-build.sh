#!/usr/bin/env bash
# Netlify build: apply DB schema + seed, then build the app.
# Designed for the Neon–Netlify integration, which injects DATABASE_URL
# (and usually DATABASE_URL_UNPOOLED) into the build environment.
set -euo pipefail

# Schema changes (prisma db push) should use a DIRECT/unpooled connection.
# The Neon–Netlify integration injects NETLIFY_DATABASE_URL_UNPOOLED /
# NETLIFY_DATABASE_URL. Prefer an unpooled URL, falling back to pooled.
MIGRATE_URL="${DIRECT_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-${NETLIFY_DATABASE_URL:-}}}}}"

if [ -z "${MIGRATE_URL}" ]; then
  echo "ERROR: No database URL found in the build environment." >&2
  echo "Expected DATABASE_URL from the Neon–Netlify integration (or set it manually)." >&2
  exit 1
fi

echo "1/4  prisma generate"
npx prisma generate

echo "2/4  prisma db push (apply schema — idempotent, non-destructive)"
DATABASE_URL="${MIGRATE_URL}" DIRECT_URL="${MIGRATE_URL}" npx prisma db push --skip-generate

echo "3/4  seed (idempotent upserts: Expo 2026 event, superadmin, benefits)"
if ! DATABASE_URL="${MIGRATE_URL}" DIRECT_URL="${MIGRATE_URL}" npx tsx prisma/seed.ts; then
  echo "WARN: seed step failed; continuing build (schema is applied, seed can be re-run)." >&2
fi

echo "4/4  next build"
npx next build

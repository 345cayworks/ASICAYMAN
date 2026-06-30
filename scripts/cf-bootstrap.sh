#!/usr/bin/env bash
# One-shot Cloudflare bootstrap + deploy for the Adventist Business Community
# app. Run from the repo root after a fresh clone:
#
#   chmod +x scripts/cf-bootstrap.sh
#   cp .env.cf.example .env.cf   # edit with your secrets
#   ./scripts/cf-bootstrap.sh
#
# Required env (export them or put them in .env.cf next to this script):
#   CLOUDFLARE_API_TOKEN     scoped (Workers Scripts:Edit, Workers R2:Edit,
#                            Account Settings:Read, Workers KV Storage:Edit)
#   CLOUDFLARE_ACCOUNT_ID    your account id
#   DATABASE_URL             Neon pooled connection string
#   AUTH_SECRET              openssl rand -base64 32
#   NEXTAUTH_URL             https://abc.345guide.com
#   SEED_ADMIN_EMAIL         e.g. admin@345guide.com
#   SEED_ADMIN_PASSWORD      strong password
#
# Optional:
#   AD_ENGINE_KEY            Cayworks Ad Engine secret (slots no-op if unset)

set -euo pipefail

cd "$(dirname "$0")/.."

# Load local env file if it exists (gitignored — never commit secrets).
if [ -f .env.cf ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.cf
  set +a
fi

req() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "✗ Missing required env: $name" >&2
    exit 1
  fi
}
req CLOUDFLARE_API_TOKEN
req CLOUDFLARE_ACCOUNT_ID
req DATABASE_URL
req AUTH_SECRET
req NEXTAUTH_URL
req SEED_ADMIN_EMAIL
req SEED_ADMIN_PASSWORD

export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID

WRANGLER="npx --yes wrangler"

step() { printf "\n\033[1;34m▶ %s\033[0m\n" "$1"; }

step "1/6  verify wrangler can reach Cloudflare"
$WRANGLER whoami

step "2/6  ensure R2 bucket exists (idempotent)"
if $WRANGLER r2 bucket list --json 2>/dev/null | grep -q '"name": *"abc-cayman-uploads"'; then
  echo "abc-cayman-uploads already present — skipping"
else
  $WRANGLER r2 bucket create abc-cayman-uploads
fi

step "3/6  apply schema to the Neon database"
npx --yes prisma generate
DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}" \
  npx --yes prisma db push --accept-data-loss --skip-generate

step "4/6  seed admin + initial data"
SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" \
SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
SEED_ADMIN_NAME="${SEED_ADMIN_NAME:-Adventist Business Community Admin}" \
  npx --yes tsx prisma/seed.ts

step "5/6  push Worker secrets"
push_secret() {
  local name="$1" value="$2"
  if [ -z "$value" ]; then echo "  (skip $name — empty)"; return; fi
  printf '%s' "$value" | $WRANGLER secret put "$name"
}
push_secret DATABASE_URL    "$DATABASE_URL"
push_secret AUTH_SECRET     "$AUTH_SECRET"
push_secret NEXTAUTH_URL    "$NEXTAUTH_URL"
push_secret AD_ENGINE_KEY   "${AD_ENGINE_KEY:-}"

step "6/6  build + deploy"
npm ci
npm run cf:deploy

printf "\n\033[1;32m✔ Deployed.\033[0m  Open %s once DNS for abc.345guide.com lands.\n" "$NEXTAUTH_URL"

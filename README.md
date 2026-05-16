# ASI Cayman — Sprint 1

Public site and member portal for the Cayman Islands chapter of Adventist-Laymen's Services & Industries (ASI Cayman).

Sprint 1 delivers the public site, member auth, the Business & Career Expo 2026 registration funnel (with server-validated pricing and receipt upload), the member dashboard, and a working admin console.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** (CSS-first config in `globals.css`)
- **Prisma 6** with **PostgreSQL** (Neon)
- **Auth.js v5** (NextAuth) — credentials provider
- **Zod** + **react-hook-form** for validation
- **Netlify** for hosting; **Netlify Blobs** for file storage in production

## Quick start (local)

### 1. Prerequisites

- Node.js **20+** (check with `node -v`)
- A Postgres database — **Neon** recommended. Create a project at [neon.tech](https://neon.tech) and grab two connection strings:
  - Pooled (for the app)
  - Direct/unpooled (for migrations)

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
DATABASE_URL="postgresql://…?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://…"     # unpooled
AUTH_SECRET="…"                 # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
STORAGE_DRIVER="local"

SEED_ADMIN_EMAIL="admin@asicayman.org"
SEED_ADMIN_PASSWORD="ChangeMe-Immediately-2026"
```

### 4. Set up the database

```bash
npx prisma db push     # pushes schema to Neon
npm run db:seed        # creates Expo 2026 event, superadmin user, sample benefits
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in at `/auth/signin` with the seeded admin credentials. **Change the password immediately.**

## What's included

### Public pages
- `/` — homepage with hero, mission, expo feature, directory preview
- `/about` — chapter story and focus areas
- `/expo` — Expo 2026 details, attractions, exhibitor pricing, FAQ
- `/expo/register` — booth registration form (the critical Sprint 1 piece)
- `/membership` — benefits and call-to-join
- `/directory` — public business listings with search & category filter
- `/contact` — contact form

### Auth
- `/auth/signup` — create account; creates a `User` + `MemberProfile` in `PENDING` state
- `/auth/signin` — sign in with email/password

### Member dashboard (`/dashboard/*`)
- Overview — membership / listing / expo / profile-completion status cards
- Profile — edit name, phone, WhatsApp, bio, church affiliation
- My business — submit/edit a business listing (returns to PENDING on edit)
- Expo registration — view your registration, upload/replace receipt
- Benefits — list of active member benefits

### Admin console (`/admin/*`)
- Overview — stats, latest registrations, receipts queue
- Members — approve, suspend, change roles (SUPERADMIN only for role changes)
- Listings — approve, reject, feature/unfeature
- Expo registrations — filter (status, ASI, early-bird, booth, interview, video), mark paid, reject, add notes
- Receipts — pending-receipt queue
- Announcements — draft, publish, archive

### Critical business logic
- **Pricing is computed server-side** (`src/lib/pricing.ts`). The client preview is informational only. The server determines:
  - ASI member ($100) — only if `MemberProfile.membershipStatus === "ACTIVE"`
  - Early-bird ($100) — payment on or before 31 May 2026
  - Regular ($150) — otherwise
- **Receipts are access-controlled** (`/api/files/[...path]`) — admins or the owner can view, no one else.
- **Currency stored in cents** to avoid floating-point errors.

## Project structure

```
asi-cayman/
├── prisma/
│   ├── schema.prisma       # full data model
│   └── seed.ts             # creates expo event + superadmin
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (public pages)
│   │   ├── auth/           # signin, signup
│   │   ├── dashboard/      # member-only
│   │   ├── admin/          # admin/superadmin only
│   │   └── api/            # auth, files, etc.
│   ├── components/
│   │   ├── site/           # nav, footer, section header
│   │   └── forms/          # all client forms
│   ├── lib/
│   │   ├── auth.ts         # Auth.js v5 config
│   │   ├── db.ts           # Prisma singleton
│   │   ├── pricing.ts      # expo pricing — single source of truth
│   │   ├── rbac.ts         # permission checks + guards
│   │   ├── storage.ts      # local FS / Netlify Blobs adapter
│   │   └── validators.ts   # all Zod schemas
│   └── middleware.ts       # route protection
├── netlify.toml
└── .env.example
```

## Deploying to Netlify (automatic — no local machine needed)

With the **Neon–Netlify integration** enabled, `DATABASE_URL` is injected into
the build automatically. The Netlify build command runs
`scripts/netlify-build.sh`, which on every deploy: generates the Prisma client,
applies the schema (`prisma db push` — idempotent/non-destructive), runs the
idempotent seed (Expo 2026 event, superadmin, benefits), then builds the app.
So a fresh database is provisioned and seeded by the deploy itself.

Steps:

1. Push to GitHub (already connected to Netlify).
2. Confirm the Neon–Netlify integration is active (Netlify → Site → Integrations
   → Neon) so `DATABASE_URL` is present in build env.
3. In Netlify → Site configuration → Environment variables, set the few vars
   Neon does **not** provide:
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your `*.netlify.app` URL (or custom domain)
   - `STORAGE_DRIVER=netlify-blobs`
   - (optional) `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — otherwise the seed
     uses `admin@asicayman.org` / `ChangeMe-Immediately-2026`
   - (optional) `DIRECT_URL` — only if your Neon integration doesn't expose an
     unpooled URL; the build script already falls back sensibly.
4. Trigger a deploy. Watch the deploy log for `1/4 … 4/4` to confirm schema +
   seed ran. Done — the site is live and populated.

`AUTH_TRUST_HOST` is **not required** (set in code via `trustHost: true`).
Netlify Blobs is auto-configured on Netlify deploys — receipts are written there
once `STORAGE_DRIVER=netlify-blobs`.

> Note: `npm run build` (used locally) stays DB-free; only the Netlify build
> command applies the schema/seed.

## Admin operations runbook

Day-to-day tasks for ASI Cayman staff (ADMIN or SUPERADMIN), all under `/admin`:

**Approving a new member**
1. `/admin/members` → find the `PENDING` user.
2. Click **Approve** — sets the `User` to `ACTIVE` and `MemberProfile` to `ACTIVE` (records `joinedAt`).
3. **Reject** suspends the account instead. Only a SUPERADMIN can change a user's role.

**Verifying an expo payment** (the core revenue workflow)
Payment status moves through: `PENDING` → `RECEIPT_UPLOADED` → `VERIFIED`/`PAID` (or `REJECTED`).
1. Exhibitor pays at RBC (Cheque Account #06975-1154855) and uploads the receipt at `/dashboard/registration`, or emails/WhatsApps it for staff to attach.
2. `/admin/receipts` shows the pending-receipt queue. Click the receipt to open the file (access-controlled — only admins and the owner can view it).
3. Cross-check the amount against `paymentAmount` (server-computed: $100 ASI member / $100 early-bird ≤ 31 May 2026 / $150 regular).
4. On `/admin/registrations`, **Mark paid** (sets `PAID` + receipt `APPROVED`) or **Reject** (adds a note the member can see). Use filters to isolate ASI members, early-bird, booth-required, interview, or video-submission registrants.

**Business listings**
`/admin/listings` — Approve/Reject (only `APPROVED` + public listings show in `/directory`), and Feature/unfeature for the homepage preview.

**Announcements**
`/admin/announcements` — draft, then publish to an audience (`ALL`, `MEMBERS`, `EXHIBITORS`, `ADMINS`). Archive to retire.

**Exporting** — registration/member tables are filterable; export via the table actions for reporting.

## Security posture

- **RBAC** enforced in two layers: edge middleware (`src/middleware.ts`) gates `/dashboard` and `/admin`; every server action and admin page re-checks via `requirePermission`/`requireAdmin` (`src/lib/rbac.ts`).
- **Server-authoritative pricing** — the client preview is never trusted; `computeExpoPrice` runs on every registration write.
- **Access-controlled file serving** — `/api/files/[...path]` requires auth, restricts to admins or the file owner, blocks path traversal (string check + resolved-path containment), and serves with `X-Content-Type-Options: nosniff`.
- **Security headers** applied app-wide in `next.config.ts` (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) so they hold on any host, with `netlify.toml` reinforcing them on Netlify.
- **`trustHost: true`** is set in code (`src/lib/auth.config.ts`) so Auth.js works on Netlify even if `AUTH_TRUST_HOST` is not set as an env var.
- Passwords hashed with bcrypt (cost 12); receipts limited to 8 MB and JPG/PNG/HEIC/WEBP/PDF only.

## What's next (Sprint 2+)

See `QA_CHECKLIST.md` for the manual test plan, and refer to the original brief for Sprint 2–5 scope:

- Email magic-link sign-in / password reset
- Member-only announcements page in the dashboard
- Public detail page per business listing
- Admin contact-messages inbox view
- Image uploads for profile photos and business logos
- Email notifications on receipt approval and payment confirmation
- Lighthouse + a11y pass

## Default admin login (post-seed)

```
Email:    admin@asicayman.org   (or your SEED_ADMIN_EMAIL)
Password: ChangeMe-Immediately-2026   (or your SEED_ADMIN_PASSWORD)
```

**Change this immediately after first sign-in.**

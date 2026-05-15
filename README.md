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

## Deploying to Netlify

1. Push to GitHub.
2. Connect the repo in Netlify. The included `netlify.toml` handles build + Next plugin.
3. In Netlify → site settings → environment variables, set:
   - `DATABASE_URL` (Neon pooled)
   - `DIRECT_URL` (Neon direct)
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (your `*.netlify.app` URL — or your custom domain)
   - `AUTH_TRUST_HOST=true`
   - `STORAGE_DRIVER=netlify-blobs`
   - (optional) email/SMTP vars
4. Trigger a deploy. Run `npx prisma db push` once locally (or as a Netlify build hook) against your production database to apply the schema.
5. Run the seed against production once: `npm run db:seed` (with prod env vars).

Netlify Blobs is auto-configured on Netlify deploys — no extra setup. Receipts will be written there once `STORAGE_DRIVER=netlify-blobs`.

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

# ASI Cayman — Sprint 1 QA Checklist

Run through this list after `npm run dev` against a fresh database to validate the Sprint 1 deliverable.

## Setup

- [ ] `npm install` completes without errors
- [ ] `cp .env.example .env` and fill `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET`
- [ ] `npx prisma db push` succeeds and creates all tables
- [ ] `npm run db:seed` succeeds — outputs admin credentials and event creation
- [ ] `npm run dev` starts on `http://localhost:3000` without console errors

## Public site

### Homepage `/`
- [ ] Hero renders with staggered fade-in animation
- [ ] "Register for Expo" CTA goes to `/expo/register`
- [ ] "Become a member" CTA goes to `/membership`
- [ ] Expo feature card shows correct date (June 28, 2026), time (2:00 PM), venue (The Lion Center)
- [ ] Contact strip footer links to `mailto:` and WhatsApp

### About `/about`
- [ ] Renders "Formed in 2001" story
- [ ] All 6 focus areas display (Health, Education, Evangelism, Community service, Family concerns, Special projects)

### Expo `/expo`
- [ ] Dark hero with date/time/venue stats
- [ ] All 8 public attractions visible
- [ ] Pricing cards display: $100 ASI member, $100 early-bird, $150 regular
- [ ] RBC payment account info correct: ASI Cayman Cheque Account #06975-1154855
- [ ] FAQ accordion expands/collapses on click

### Membership `/membership`
- [ ] 6 benefit cards render
- [ ] CTA "Create my account" links to `/auth/signup`

### Directory `/directory`
- [ ] Shows empty state when no listings approved
- [ ] Search input works (URL updates with `?q=`)
- [ ] Category filter populated from approved listings only

### Contact `/contact`
- [ ] Form submits successfully → "Message sent" confirmation
- [ ] Empty-state submit shows validation errors
- [ ] `ContactMessage` row created in DB

## Mobile responsiveness

- [ ] Nav collapses to hamburger menu < 768px
- [ ] Mobile menu opens/closes
- [ ] Footer columns stack on mobile
- [ ] Cards and grids reflow without horizontal scroll

## Authentication

### Signup `/auth/signup`
- [ ] Form validates: password ≥ 8 chars, passwords match, valid email
- [ ] Submit creates `User` (status PENDING) + `MemberProfile` (status PENDING)
- [ ] Auto sign-in redirects to `/dashboard?welcome=1`
- [ ] Welcome banner shows on first visit

### Signin `/auth/signin`
- [ ] Wrong password → "Invalid email or password"
- [ ] Successful login redirects to `/dashboard` (or `callbackUrl` if provided)
- [ ] Signed-in user visiting `/auth/signin` redirects to `/dashboard` (middleware)

### Middleware
- [ ] Unauthenticated `/dashboard/*` redirects to `/auth/signin?callbackUrl=…`
- [ ] Non-admin trying `/admin` redirects to `/dashboard`
- [ ] Admin trying `/admin` succeeds

## Expo registration `/expo/register`

### Pricing path 1 — verified ASI member
- [ ] Admin marks a member's `MemberProfile.membershipStatus = ACTIVE`
- [ ] That member fills the form with `isAsiMember = true`
- [ ] Submitted amount in DB is `10000` (= $100), reason `MEMBER`

### Pricing path 2 — early-bird, not a member
- [ ] Current date ≤ 31 May 2026
- [ ] Submit with `isAsiMember = false`
- [ ] Submitted amount = `10000`, `earlyBirdApplied = true`, reason `EARLY_BIRD`

### Pricing path 3 — regular
- [ ] Simulate post-31-May by setting `Event.earlyBirdUntil` to a past date
- [ ] Submit with `isAsiMember = false`
- [ ] Submitted amount = `15000` (= $150), reason `REGULAR`

### Receipt upload
- [ ] Valid JPG attaches and uploads → `ExpoRegistration.receiptUrl` populated
- [ ] Valid PDF works
- [ ] File > 8 MB → "larger than 8 MB" error
- [ ] Unsupported type (e.g. `.txt`) → "Receipt must be a JPG, PNG, HEIC, WEBP, or PDF file"
- [ ] `PaymentReceipt` audit row created
- [ ] Receipt accessible via `/api/files/...` to the owner and to admins, 403 for everyone else

### Re-registration
- [ ] Submitting the form twice with the same email + event updates the existing row (`@@unique([eventId, email])`)
- [ ] Does not create duplicates

### Success state
- [ ] Confirmation shows correct $ amount and pricing reason
- [ ] "Next steps" lists RBC account and shows correct messaging based on whether receipt was uploaded

## Dashboard `/dashboard`

- [ ] Status cards show: membership, listing, expo, profile completeness
- [ ] Profile-completion % updates after editing profile

### Profile `/dashboard/profile`
- [ ] Form pre-fills with existing values
- [ ] Email field is disabled
- [ ] Save updates `User.name`, `User.phone`, `User.whatsapp`, `MemberProfile.bio`, `MemberProfile.churchAffiliation`

### Business `/dashboard/business`
- [ ] First save creates a `BusinessListing` with `status = PENDING`
- [ ] Subsequent edits keep status as PENDING (or reset if previously APPROVED)
- [ ] Validation: description ≥ 20 chars

### Registration `/dashboard/registration`
- [ ] If no registration: empty state with CTA to `/expo/register`
- [ ] If registration exists: shows business name, amount, status badge, full details
- [ ] Receipt upload here works the same as on the public form

### Benefits `/dashboard/benefits`
- [ ] Shows seeded benefits

## Admin `/admin`

### Overview
- [ ] Stat cards show correct counts (members, listings, expo paid, revenue)
- [ ] Latest registrations list updates after new registration

### Members `/admin/members`
- [ ] Approve sets `User.status = ACTIVE` and `MemberProfile.membershipStatus = ACTIVE` (+ `joinedAt`)
- [ ] Suspend sets `User.status = SUSPENDED` and `MemberProfile.membershipStatus = REVOKED`
- [ ] SUPERADMIN can change roles; ADMIN cannot (action will reject if non-SUPER tries)
- [ ] Status & role filters work

### Listings `/admin/listings`
- [ ] Approve sets `BusinessListing.status = APPROVED` and the listing now appears in `/directory`
- [ ] Reject hides from directory
- [ ] Feature/unfeature toggles `isFeatured`

### Expo registrations `/admin/registrations`
- [ ] All filter chips work (status, ASI, early-bird, booth, interview, video)
- [ ] Mark paid → `paymentStatus = PAID`, related `PaymentReceipt.status = APPROVED`
- [ ] Reject + note → `paymentStatus = REJECTED`, `adminNotes` stored
- [ ] Save note persists without changing status
- [ ] View Receipt link opens the file (admin always allowed)

### Receipts `/admin/receipts`
- [ ] Shows only `PaymentReceipt.status = UPLOADED`
- [ ] Approve & mark paid moves both records to approved/paid
- [ ] Empty state when queue is clear

### Announcements `/admin/announcements`
- [ ] Save draft creates `status = DRAFT`
- [ ] Publish creates `status = PUBLISHED` with `publishedAt`
- [ ] Archive moves it out of the visible list

## Cross-cutting

- [ ] No console errors on any page after navigation
- [ ] Sign out from dashboard or admin returns to `/` cleanly
- [ ] All pages render without server errors when the database is empty
- [ ] Tab order is sensible on forms
- [ ] All form inputs have visible labels

## Lighthouse (run before declaring Sprint 1 done)

- [ ] Homepage: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- [ ] `/expo/register` (with cold form): Performance ≥ 85, Accessibility ≥ 95

## Pre-deploy

- [ ] `npm run build` completes without errors
- [ ] `prisma generate` runs as part of build
- [ ] All env vars set in Netlify before first deploy
- [ ] First post-deploy login works and admin password is changed

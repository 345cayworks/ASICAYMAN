# Tracking (Google Analytics / Facebook Pixel)

SuperAdmin-managed analytics, configurable at runtime — no redeploy, no env
vars, no raw-HTML snippet field.

## Where it lives

- **UI:** `/admin/settings` → "Tracking" section. SuperAdmin only
  (`requireSuperadmin`).
- **Action:** `src/app/admin/settings/actions.ts` → `updateTrackingSettings`.
- **Store:** Prisma `SystemSetting` rows
  (`platform.tracking.enabled` / `…ga.id` / `…fb.pixelId`).
- **Renderer:** `src/components/site/analytics.tsx`, mounted once in
  `src/app/layout.tsx` so it runs on every page (marketing, app, auth,
  admin).
- **Audit:** Prisma `AuditLog` action `tracking.update`.

## Design rationale: structured IDs only

The Tracking form accepts only validated IDs — never a freeform `<script>`
snippet. The renderer wraps those IDs in the canonical Google and Facebook
templates server-side. This keeps the XSS surface at zero: an attacker
(or a copy-paste mistake) can't smuggle arbitrary JavaScript through the
settings UI because there is nowhere to put it.

## Validation patterns

Pure helpers in `src/lib/tracking-validate.ts` (no IO, unit-tested under
`tests/tracking.test.ts`):

| Helper            | Rule                          |
|-------------------|-------------------------------|
| `normalizeGaId`   | `input.trim().toUpperCase()`  |
| `isValidGaId`     | `^G-[A-Z0-9]+$` (post-normalize) |
| `isValidFbPixelId`| `^\d{6,20}$` (post-trim)      |

Both are checked twice: once at the action layer to reject bad input, and
again at render time inside `Analytics` before any value is interpolated
into an inline `<script>`. Only the validator-confirmed ID is ever
interpolated — no other request-scoped value is allowed inside the
script body.

Empty strings are valid at the action layer and mean "unset"; the
renderer treats null/empty as "disabled for that platform".

## Defaults

Ships **disabled** with **empty IDs**. The seed (`prisma/seed.ts`) inserts
the three rows idempotently with empty values on first run and never
overwrites operator-configured values on subsequent deploys. There is no
seeded Google Analytics Measurement ID — the operator must set their own
in the SuperAdmin UI after deploy.

## Revalidation

`updateTrackingSettings` calls `revalidatePath("/", "layout")` after the
write, so the script tags appear (or disappear) immediately across every
page on the next request — no redeploy required.

## Audit redaction

The `AuditLog` row for `tracking.update` records only booleans:

```json
{ "enabled": true, "gaIdSet": true, "fbPixelSet": false }
```

Raw IDs are **never** persisted to audit details. Actor identity
(`actorUserId`, `actorEmail`) comes from the authenticated SuperAdmin.

## What is NOT done (operator follow-up)

When tracking is enabled, the public **privacy policy** likely needs to
mention Google Analytics and/or Facebook Pixel and how visitors can opt
out. That copy change is intentionally not auto-applied here — flag it
as a follow-up and update the privacy page accordingly.

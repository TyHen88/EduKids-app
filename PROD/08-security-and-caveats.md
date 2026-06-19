# 08 · Security & Known Caveats

## Known caveats (must understand before launch)

### Billing is stubbed — hearts are effectively unlimited
`db/queries.ts` → `getUserSubscription()` **always returns `{ isActive: true }`** (Stripe was removed). Gameplay actions branch on this, so:
- Users never actually run out of hearts in a blocking way.
- The "refill hearts" path and hearts modal exist but billing is not real.
- There is **no payment processing**. Do not advertise paid plans.

If you need real subscriptions, reintroduce a billing provider, restore a `userSubscription` table, and make `getUserSubscription()` read real state.

### Auth is enforced per-page/per-action, not by blanket middleware
`proxy.ts` runs `clerkMiddleware()` + locale redirect, but route **protection** is done in each server component / server action via `auth()` and `getIsAdmin()` (`lib/admin.ts`). There is no global "protect everything" rule. When adding new routes/actions, **you must add the `auth()` check yourself**.

### Admin model
Admin access = the signed-in Clerk `userId` is present in `CLERK_ADMIN_IDS` (comma-and-space separated). Server actions for course/content/profile mutations call `getIsAdmin()` / `auth()`. Production user IDs differ from dev — repopulate `CLERK_ADMIN_IDS` for prod.

### Uploaded profile photos are not moderated
The profile editor allows photo upload via Clerk (`user.setProfileImage`). Clerk hosts the image but does **not** moderate content. For a young-kids product, consider:
- presets-only for students, uploads behind a parent/teacher, or
- adding a moderation step. Images render from `img.clerk.com` / `images.clerk.dev` (allow-listed).

### i18n gotcha
Locales are `["km","en"]`, default `km`. The Khmer dictionary file is **`dictionaries/kh.json`** (not `km.json`). Both JSON files must keep **identical keys** (the `Dictionary` type is their union) or `tsc` breaks. Navigation must be **locale-prefixed** (`/${locale}/...`).

### Schema changes have no migration history
`drizzle-kit push` mutates the live DB to match `db/schema.ts`. There are no migration files to review/roll back. Snapshot the Neon branch before structural changes.

## Security hardening checklist

### Secrets
- [ ] `CLERK_SECRET_KEY` and `DATABASE_URL` only in server env (never `NEXT_PUBLIC_*`).
- [ ] `.env` never committed; rotate any leaked key (Clerk + Neon support rotation).
- [ ] Vercel env scoped correctly (Production vs Preview).

### Transport & headers
- [ ] HTTPS enforced (Vercel does this for custom domains).
- [ ] Consider a `Content-Security-Policy` and security headers (Next `headers()` in `next.config.ts`). Note the old permissive `/api/*` CORS block was removed when the REST API was dropped — don't reintroduce wildcard CORS.

### Authn/z
- [ ] Every new server action starts with `auth()` (and `getIsAdmin()` for admin ops).
- [ ] Rate limiting on auth endpoints — Clerk provides bot protection; enable it. Consider Vercel/Upstash rate limiting for custom write actions if abused.

### Data
- [ ] Drizzle uses parameterized queries (safe from SQL injection by default) — keep it that way; avoid raw string interpolation in `sql` templates.
- [ ] Cascade deletes are intentional: deleting a course removes its units/lessons/challenges/options **and** related progress (`onDelete: cascade`). The admin UI warns; confirm this is desired.

### Privacy (children)
- [ ] Collect minimal PII (email via Clerk; display name/avatar are app-level).
- [ ] Publish a privacy policy; review **COPPA** (US) / **GDPR-K** (EU) obligations for under-13 users.
- [ ] Provide account deletion (Clerk supports user deletion; ensure related `userProgress`/`userBadges` are cleaned — they key off `userId`).

### Dependencies
- [ ] `npm audit` reviewed; pin/update critical advisories.
- [ ] Keep `@clerk/*`, `next`, `drizzle-orm` updated (test the Future-API auth flows after Clerk upgrades — they're the most likely to break).

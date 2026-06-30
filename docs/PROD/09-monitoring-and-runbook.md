# 09 · Monitoring & Runbook

## Observability to set up

| Concern | Tool | Notes |
|---------|------|-------|
| Runtime errors | **Sentry** (or Vercel's error tracking) | Add `@sentry/nextjs`; capture server actions + client. |
| Web vitals / traffic | **Vercel Analytics** / **Speed Insights** | One-click on Vercel. |
| Logs | **Vercel logs** / drain to a provider | Server component + action logs land here. |
| Auth events | **Clerk Dashboard** | Sign-ups, failed logins, OAuth errors, bot blocks. |
| Database | **Neon dashboard** | Connections, storage, slow queries; set usage alerts. |
| Uptime | **Better Uptime / Pingdom** | Ping `/<locale>` (e.g. `/en`) every minute. |

## Key health signals

- **5xx rate** on Vercel — spikes usually mean a DB outage, bad env var, or a Clerk misconfig.
- **Auth failure rate** in Clerk — spikes after a Clerk version bump may mean the Future-API flows regressed.
- **Neon connection errors** — check pooled connection string and Neon status.
- **`next/image` host errors** in client logs — a new image source needs allow-listing in `next.config.ts`.

## Common incidents & fixes

### "Invalid src prop … hostname not configured" (image 500)
Add the hostname to `images.remotePatterns` in `next.config.ts`, then **redeploy** (config changes need a rebuild/restart — they are not hot-reloaded).

### Sign-up / forgot-password: "send a verification code before attempting to verify"
Clerk dashboard doesn't have **email verification code** enabled, **or** the send/verify steps lost the resource instance. The code pins the instance via `useRef`; if it recurs after a Clerk upgrade, re-check the Future-API flow in `app/[lang]/(auth)/*`.

### Google sign-in bounces to a hosted `accounts.dev` page
`<ClerkProvider>` must have `signInUrl`/`signUpUrl`/fallback URLs (it does). On **dev** instances a brief `accounts.dev` flash is normal; it disappears on a **production** instance with a custom domain.

### Admin pages redirect an admin to `/learn`
Their Clerk **production** `userId` isn't in `CLERK_ADMIN_IDS`, or the separator isn't ", " (comma **and** space). Fix env, redeploy.

### Users redirected to `/courses` forever
`/learn` redirects there when there's no **active course**. Ensure courses exist (admin/seed) and the user selected one.

### Data looks stale after an admin edit
Server actions call `revalidatePath` and the client calls `router.refresh()`. If a custom page caches, confirm it isn't statically rendered (auth pages are dynamic).

## Deploy / rollback

- **Deploy:** push to the production branch → Vercel builds. Watch the build log for `tsc` / build errors.
- **Rollback:** Vercel → Deployments → promote a previous green deployment (instant). Code rollback does **not** revert DB schema — if a deploy included a `db:push`, plan a DB rollback separately (Neon branch restore).
- **Schema change procedure:** snapshot Neon branch → `db:push` from a trusted machine/CI → deploy code that depends on it.

## Backups & DR

- Neon: enable point-in-time restore / keep a `production` branch; periodically branch a snapshot.
- Secrets: store a copy of production env vars in a password manager / Vercel (source of truth).
- Document the **restore drill**: branch-restore Neon → repoint `DATABASE_URL` → redeploy.

## Routine maintenance

- Monthly: `npm audit`, dependency updates (especially `@clerk/*`, `next`, `drizzle-orm`), re-run the auth smoke test from [07](./07-pre-launch-checklist.md).
- Watch Clerk changelog for **Future/Signals API** changes — that surface is the most upgrade-sensitive part of this app.

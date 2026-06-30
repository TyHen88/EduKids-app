# 02 · Environment Variables

All variables the app reads, where each comes from, and dev vs production values.

> **Local file:** use **`.env`** (not `.env.local`). The `db:*` commands (`drizzle.config.ts`, `scripts/prod.ts`) load `.env` via `dotenv/config`. Next.js reads `.env` too. `.env*` is git-ignored except `.env.example`.

## Canonical production `.env`

```bash
# ── Database (Neon serverless Postgres) ──────────────────────────────
# Use the POOLED connection string for the app; a direct (non-pooled)
# string is fine for one-off db:push / db:prod.
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# ── Clerk (PRODUCTION instance keys — pk_live / sk_live) ──────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx

# Clerk user IDs allowed into /[lang]/admin.
# Comma-AND-space separated — the code splits on ", "  (lib/admin.ts)
# These are PRODUCTION user IDs (different from your dev instance!).
CLERK_ADMIN_IDS=user_abc123, user_def456

# ── App ──────────────────────────────────────────────────────────────
# Public base URL of the deployed site (no trailing slash).
NEXT_PUBLIC_APP_URL=https://edukids.app
```

## Variable-by-variable

| Variable | Public? | Source | Notes |
|----------|---------|--------|-------|
| `DATABASE_URL` | server | Neon → Connection details | Pooled string for the app. Required by app, `drizzle-kit`, and seed. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **public** | Clerk → API Keys | Must be the **production** key (`pk_live_…`) in prod. |
| `CLERK_SECRET_KEY` | server | Clerk → API Keys | Production `sk_live_…`. **Never** expose. |
| `CLERK_ADMIN_IDS` | server | Clerk → Users (copy each user's ID) | Comma **and space** separated. Wrong separator = no admins. |
| `NEXT_PUBLIC_APP_URL` | **public** | You | Used by `absoluteUrl()` in `lib/utils.ts`. Set to the real domain. |

### Optional Clerk URL overrides
The app already serves custom auth pages and sets `signInUrl` / `signUpUrl` on `<ClerkProvider>` in `app/[lang]/layout.tsx`. You generally do **not** need `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `_SIGN_UP_URL`. If you set them, keep them consistent with the locale-prefixed routes.

## No longer used (safe to omit)

The original template had Stripe billing; it has been **removed/stubbed**. These are **not** required and can be left unset/deleted:

- `STRIPE_API_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

`.env.example` and `environment.d.ts` may still mention them — see [06-code-changes-before-launch.md](./06-code-changes-before-launch.md) for the cleanup.

## Where to set them

- **Local:** `Final-app/.env`
- **Vercel:** Project → Settings → Environment Variables. Add each one for the **Production** environment (and Preview if you want preview deploys to work). `NEXT_PUBLIC_*` are exposed to the browser by design — only put non-secret values there.

## Security rules

- Never commit `.env`. Only `.env.example` is tracked.
- Rotate `CLERK_SECRET_KEY` and `DATABASE_URL` if they ever leak (Clerk + Neon both support rotation).
- Treat `pk_live` as public (it's meant to ship to the browser); treat `sk_live` and `DATABASE_URL` as secrets.

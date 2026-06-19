# 01 · Prerequisites

Accounts, services, and tooling you need before deploying.

## Required accounts

| Service | Purpose | Plan notes |
|---------|---------|------------|
| **Neon** (neon.tech) | Serverless Postgres database | Free tier works to launch; upgrade for autoscaling/backups |
| **Clerk** (clerk.com) | Authentication (email/password, Google) | Free dev is fine to build; **Production instance** required for a real domain |
| **Vercel** (vercel.com) | Hosting (Next.js native) | Hobby works for testing; **Pro** recommended for production (analytics, more build minutes, team) |
| **Google Cloud Console** | Google OAuth credentials (for "Continue with Google" on a **production** Clerk instance) | Free |
| A **domain** registrar | Your custom domain (e.g. `edukids.app`) | Needed for Clerk production custom domain + branded URLs |

## Why a domain matters here

On a Clerk **development** instance, Google OAuth routes through Clerk's shared `*.accounts.dev` domain (you'll see a brief redirect flash). A Clerk **production** instance with your own domain removes that and is required for a trustworthy sign-in experience. See [03-clerk-production.md](./03-clerk-production.md).

## Local tooling

- **Node.js 20+** (the app was validated on Node 24). Match Vercel's Node version.
- **npm** (repo uses `package-lock.json`).
- **git**.

## Repo facts

- The deployable app lives in the **`Final-app/`** directory. If the repo root is `MigrateUI`, set the Vercel **Root Directory** to `Final-app`.
- No test suite exists. CI quality gates are `npm run lint` and `npm run typecheck` (and the build).
- Schema changes are applied with `npm run db:push` — there are **no migration files**.

## Commands reference

```bash
npm run dev          # local dev (Turbopack, port from package.json)
npm run build        # production build (Turbopack)
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run db:push      # apply db/schema.ts to the database (no migration files)
npm run db:studio    # Drizzle Studio (inspect data)
npm run db:prod      # seed demo data — ⚠️ DELETES ALL DATA FIRST
```

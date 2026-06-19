# 05 · Deploy to Vercel

Next.js is built by Vercel, so this is the smoothest target. (Any Node host that runs `next build` / `next start` works too — notes at the end.)

## Step 1 — Import the project

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Vercel → **Add New → Project** → import the repo.
3. **Root Directory**: set to **`Final-app`** (the deployable app is in this subfolder; the repo root is `MigrateUI`).
4. **Framework Preset**: Next.js (auto-detected).
5. **Build Command**: default `next build` (the repo's `build` script uses `next build --turbopack`; either is fine — Vercel will run the package script).
6. **Install Command**: default (`npm install`).
7. **Node.js Version**: 20.x or newer (Project → Settings → General). Match your local major version.

## Step 2 — Environment variables

Add every var from [02-environment-variables.md](./02-environment-variables.md) under **Settings → Environment Variables** for the **Production** environment (and **Preview** if you want PR previews to function):

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`)
- `CLERK_SECRET_KEY` (`sk_live_…`)
- `CLERK_ADMIN_IDS`
- `NEXT_PUBLIC_APP_URL` → your production URL (e.g. `https://edukids.app`)

> `NEXT_PUBLIC_APP_URL` must match the deployed domain, and the Clerk **production** keys must be used with the Clerk **custom domain** from [03](./03-clerk-production.md).

## Step 3 — Domains

1. Vercel → **Settings → Domains** → add `edukids.app` (and `www`).
2. Point DNS as Vercel instructs.
3. Keep the Clerk custom domain (`clerk.edukids.app`) DNS from [03](./03-clerk-production.md) in place too.

## Step 4 — Database schema must already exist

Vercel builds **don't** run `db:push`. Apply the schema **before/independently** of deploy (from your machine or a CI job) per [04-database-neon.md](./04-database-neon.md). The build itself doesn't need DB access; runtime pages do.

## Step 5 — Deploy & verify

1. Trigger a deploy (push to the production branch).
2. Watch the build log — it should compile and run `tsc` cleanly (the project builds green locally).
3. Smoke-test the live site using [07-pre-launch-checklist.md](./07-pre-launch-checklist.md).

## Image optimization

`next.config.ts` allow-lists remote image hosts:
`api.dicebear.com`, `images.unsplash.com`, `img.clerk.com`, `images.clerk.dev` (uploaded Clerk avatars), with `dangerouslyAllowSVG` on (DiceBear returns SVG).
If you add new avatar/content image sources, add their hostnames here or `next/image` will 500 at runtime.

## Middleware note

`proxy.ts` (Next 16's middleware file) does locale redirect + `clerkMiddleware()`. Vercel runs it on the Edge automatically. The matcher already excludes `_next`, static assets, and common file types — no extra config needed.

## CI quality gate (recommended)

Before deploy, run in CI:
```bash
npm ci
npm run lint
npm run typecheck
npm run build
```
There is no test suite; these three are your gate.

## Non-Vercel hosting

Any Node 20+ host works:
```bash
npm ci && npm run build && npm run start
```
Provide the same env vars, run a process manager (or container), and put it behind HTTPS. Ensure the platform supports Next 16 App Router + Edge middleware (or adapt `proxy.ts`).

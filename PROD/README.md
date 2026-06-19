# EduKids — Production Guide

Everything needed to take **EduKids** (the `Final-app` project) from local development to a live production deployment.

Read the files in order — they're numbered.

| # | File | What it covers |
|---|------|----------------|
| — | [README.md](./README.md) | This index + quickstart |
| 01 | [01-prerequisites.md](./01-prerequisites.md) | Accounts & services you need |
| 02 | [02-environment-variables.md](./02-environment-variables.md) | Every env var, where it comes from |
| 03 | [03-clerk-production.md](./03-clerk-production.md) | Clerk production instance, custom domain, email/password, Google OAuth, admins |
| 04 | [04-database-neon.md](./04-database-neon.md) | Neon Postgres, schema push, seeding, backups |
| 05 | [05-deployment-vercel.md](./05-deployment-vercel.md) | Deploying to Vercel |
| 06 | [06-code-changes-before-launch.md](./06-code-changes-before-launch.md) | App-specific cleanups (branding, demo content, leftover template bits) |
| 07 | [07-pre-launch-checklist.md](./07-pre-launch-checklist.md) | One-page go/no-go checklist |
| 08 | [08-security-and-caveats.md](./08-security-and-caveats.md) | Security hardening + known caveats |
| 09 | [09-monitoring-and-runbook.md](./09-monitoring-and-runbook.md) | Post-launch monitoring & incident runbook |
| 10 | [10-email-templates.md](./10-email-templates.md) | Branded Clerk email templates (verification & reset code) |

## The stack (what you're deploying)

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Clerk** auth — uses the new **Future/Signals API** (`@clerk/nextjs` v7). Custom sign-in / sign-up / forgot-password pages + Google OAuth.
- **Drizzle ORM** on **Neon** serverless Postgres (HTTP driver). Schema applied with `drizzle-kit push` (no migration files).
- **Tailwind CSS 3** + shadcn/ui · **Zustand** (modals) · **motion** (animations)
- i18n under `/[lang]` (`km` default, `en`). Locale routing via `proxy.ts` (Next 16 middleware).

## 10-minute quickstart (experienced operator)

1. **Neon**: create a production project/branch → copy the pooled connection string.
2. **Clerk**: create/activate a **Production** instance → set custom domain → enable **Email + Password (email code)** and **Google OAuth** → copy `pk_live_…` / `sk_live_…`.
3. **Vercel**: import the repo, root = `Final-app`, framework = Next.js. Add all env vars from [02](./02-environment-variables.md).
4. Locally, point `.env` at the **production** Neon DB and run `npm run db:push` (creates tables). Optionally seed real course content via the admin panel (preferred) or `npm run db:prod` (⚠️ wipes).
5. Add your production Clerk **user id(s)** to `CLERK_ADMIN_IDS`.
6. Work through [06](./06-code-changes-before-launch.md) and [07](./07-pre-launch-checklist.md), then deploy.

## Current readiness status

- ✅ Production build passes (`next build --turbopack`) and `tsc --noEmit` is clean.
- ✅ Custom auth (email/password + Google) implemented against Clerk's Future API.
- ⚠️ **Billing is stubbed** — hearts are effectively unlimited; there is no real payment. See [08](./08-security-and-caveats.md).
- ⚠️ Some **leftover template content** (promo banner, fork links, demo seed data) must be edited before launch. See [06](./06-code-changes-before-launch.md).

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The line above is intentional and important. This repo runs a version of Next.js with breaking changes from what you may know. **Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** and heed deprecation notices.

## Project

**EduKids** — a Duolingo-style learning app for kids. It is the result of a migration that combines:

- **UI** from the `edukids-learning-path` prototype (Vite/React + indigo design).
- **Backend** from `myKids-app` ("romduol-kids") — the **core** only.

Courses (Khmer, English, Math) → units → lessons → challenges (multiple-choice quizzes) with hearts, XP/points, a learning-path "journey", badges/achievements, and a leaderboard ("Friends Club").

## Commands

```bash
npm run dev          # dev server (Next.js + Turbopack)
npm run build        # production build (Turbopack)
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format:fix   # prettier --write

npm run db:push      # push db/schema.ts to the database (drizzle-kit, no migration files)
npm run db:studio    # open Drizzle Studio
npm run db:prod      # seed the database (runs scripts/prod.ts — WIPES all data first)
```

There is **no test suite**. Schema changes are applied with `db:push` (Drizzle generates no migration files).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 3 + shadcn/ui (Radix) · Drizzle ORM (`postgres-js`) on Supabase Postgres · Supabase Auth (`@supabase/ssr`) · Zustand (client modals) · `motion` (animations) · `lucide-react`. Path alias `@/*` → repo root.

### Auth (Supabase)
Auth was migrated from Clerk to Supabase Auth — see `SUPABASE_SETUP.md` for project setup. Key files:
- `lib/supabase/{server,client,admin,middleware}.ts` — SSR clients. `server` (Server Components/Actions, async — `await createClient()`), `client` (browser), `admin` (service-role, server-only, for user management), `middleware` (session refresh).
- `lib/auth.ts` — server helpers `auth()` → `{ userId }` and `currentUser()` (normalized `{ id, email, firstName, imageUrl, username }`). Most server code imports `auth` from here instead of Clerk.
- `proxy.ts` (Next 16's `middleware.ts`) runs the locale redirect **and** Supabase session refresh.
- Client sign-out: `lib/use-sign-out.ts`; user menu (replaces `<UserButton>`): `components/auth/user-menu.tsx`.
- Child/kids accounts: `actions/family.ts` uses the Supabase **admin** API to create/delete users with a synthetic `${username}@dummy.edukids.com` email + PIN-derived password; `kids-login` signs in with that pair.

## Architecture

### Data layer (`db/`)
- `db/schema.ts` — single source of truth. Hierarchy: `courses → units → lessons → challenges → challengeOptions`. Plus `challengeProgress`, `userProgress` (hearts/points/**streak**/active course), and `badges` + `userBadges` (achievements). `courses` carry extended `description`/`category`/`difficulty`. `challengesEnum` is `SELECT | ASSIST`.
- `db/drizzle.ts` — exports the `db` client (`postgres-js` driver against Supabase Postgres + schema). Uses `prepare: false` for Supabase's transaction pooler (pgbouncer), plus `idle_timeout`/`connect_timeout`.
- `db/queries.ts` — all reads, each wrapped in React `cache()` and scoped to the Supabase auth `userId` (via `auth()` from `lib/auth.ts`). Key queries: `getUserProgress`, `getUnits`, `getCourseProgress`, `getLesson(Percentage)`, `getCoursesWithProgress` (courses decorated with per-user progress %/status for "My Backpack"), `getBadges`/`getUserBadges`, `getTopTenUsers` (leaderboard), `getAdminStats`. `getUserSubscription` is a **stub** that always returns `isActive: true` (Stripe was removed) — gameplay actions still branch on it so hearts are effectively unlimited.
- Writes are **server actions** in `actions/` (`"use server"`): `upsertChallengeProgress`, `reduceHearts`, `refillHearts`, `upsertUserProgress(courseId, lang)`. They call `auth()`, mutate, then `revalidatePath(...)`. Gameplay constants in `constants.ts` (`MAX_HEARTS = 5`, `POINTS_TO_REFILL = 10`, +10 points per challenge, `QUESTS` XP thresholds reused for dashboard "Today's Goals").

### Internationalization (`app/[lang]/`)
The entire app lives under the `[lang]` dynamic segment.
- `app/[lang]/dictionaries.ts` (`server-only`) — `locales = ["km", "en"]`, default `km`. **Gotcha:** the Khmer locale code is `km` but its file is `dictionaries/kh.json`. Keys are flat dotted strings; access with a fallback, e.g. `dict["lesson.greatJob"] || "Great job!"`. Both JSON files must keep identical keys (the `Dictionary` type is their union).
- `app/[lang]/layout.tsx` wraps everything in `DictionaryProvider` (no auth provider needed — Supabase uses cookie-based sessions). Client components read copy via `useDictionary()` and the locale via `useLocale()`.
- **Navigation must be locale-prefixed** — link to `/${locale}/learn`, not `/learn`.

### Route groups under `[lang]`
- `(marketing)` — public landing (sign-in/up entry).
- `(auth)` — Supabase auth pages: `sign-in`, `sign-up` (email OTP), `forgot-password` (recovery OTP), `kids-login` (PIN), and `sso-callback/route.ts` (Google OAuth code exchange).
- `(main)` — the student app shell. `layout.tsx` (server) fetches `getUserProgress` + `getIsAdmin` and renders **`components/main-shell.tsx`** (client): indigo header with Streak/Hearts/Gems stats + top nav (desktop) and bottom nav (mobile). Pages:
  - `learn/` — **dashboard** (welcome hero, Continue Adventure card, points-based Today's Goals, Recent Rewards, Friends Club). Redirects to `courses` if no active course.
  - `path/` — the **learning journey** (wavy SVG path). Server page maps real units→lessons into nodes (completed/unlocked/locked; last-in-unit = quiz, last-overall = exam) and feeds `components/learning-path.tsx` (client). Unlocked nodes link to the lesson player.
  - `courses/` — **My Backpack**. `getCoursesWithProgress` → `course-card.tsx` (client) whose button calls `upsertUserProgress` to set the active course.
  - `achievements/` — **Rewards Island**. All badges vs earned; `badges-grid.tsx` (client) animates with `motion`.
- `admin/` — own route + `layout.tsx` gated by `getIsAdmin()` (redirects non-admins). `components/admin-sidebar.tsx` (client) is the sidebar shell; `page.tsx` shows real counts from `getAdminStats` + a course list.
- `lesson/` — the quiz player, carried over from `myKids-app` unchanged in behavior (no prototype equivalent existed). `quiz.tsx` is the client game loop; modals are global Zustand stores in `store/`.

### What was intentionally NOT migrated (core-only)
Stripe/subscriptions (lib + webhook + table), the shop and quests **pages**, the custom config-driven admin panel and its Excel import (`xlsx`), and all REST `app/api/*` routes. The Gemini AI feature from the prototype was dropped.

## Important caveats
- **Subscriptions are stubbed** — `getUserSubscription()` always returns `isActive: true`; hearts are effectively unlimited. There is no real billing.
- **Middleware lives in `proxy.ts`** (Next 16 renamed `middleware.ts` → `proxy.ts`). It does locale redirects + Supabase session refresh, but **route protection is still per-page/per-action** via `auth()` / `getIsAdmin()` (`lib/admin.ts`, checks `ADMIN_IDS` — Supabase user UUIDs).
- `scripts/prod.ts` (`db:prod`) **deletes all data** before seeding (courses with extended fields + a starter set of badges).

## Environment
Copy `.env.example` to `.env`. Vars: `DATABASE_URL` (Supabase Postgres — use the pooled/transaction-pooler connection string), Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), `ADMIN_IDS` (**comma-and-space** separated Supabase user UUIDs: `uuid-a, uuid-b`), `NEXT_PUBLIC_APP_URL`, `BLOB_READ_WRITE_TOKEN` (Vercel Blob), VAPID keys (web push). See `SUPABASE_SETUP.md`.

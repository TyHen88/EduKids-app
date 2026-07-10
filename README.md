# EduKids

A Duolingo-style learning app for kids. Pick a course (Khmer, English, or Math), work through units and lessons made of multiple-choice challenges, and track progress with hearts, XP, streaks, badges, and a leaderboard ("Friends Club"). The UI is bilingual (Khmer / English).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 3** + **shadcn/ui** (Radix)
- **Drizzle ORM** (`postgres-js`) on **Supabase Postgres** (via the transaction pooler)
- **Supabase Auth** (`@supabase/ssr`) — email OTP, Google OAuth, and PIN login for kids accounts
- **Zustand** for client-side modal state
- **`motion`** for animations, **`lucide-react`** for icons
- **Vercel Blob** for image uploads, **web-push** (VAPID) for notifications 

> Subscriptions are **stubbed** — `getUserSubscription()` always returns active, so hearts are effectively unlimited. There is no real billing. See `CLAUDE.md`.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file and fill it in:

   ```bash
   cp .env.example .env
   ```

   See `.env.example` for every variable and `SUPABASE_SETUP.md` for the full
   Supabase project walkthrough (auth providers, email OTP templates, admin IDs).

3. Push the schema and seed the database:

   ```bash
   npm run db:push    # create tables from db/schema.ts
   npm run db:prod    # seed Khmer / English / Math courses + badges (WIPES existing data)
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001). You'll be redirected to a locale (`/km` or `/en`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack, port 3001) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` / `format:fix` | Prettier |
| `npm run db:push` | Push `db/schema.ts` to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:prod` | Seed the database (deletes all data first) |

## Admin panel

The admin area lives at `/[lang]/admin` (e.g. `/en/admin`) and shows real counts
(`getAdminStats`) plus a course list. Access is restricted to the **Supabase user
UUIDs** listed in `ADMIN_IDS` (comma-and-space separated), enforced by
`getIsAdmin()` (`lib/admin.ts`).

## Project layout

- `app/[lang]/` — all routes, scoped to a locale (`km` / `en`)
- `db/` — Drizzle schema, client, and cached read queries
- `actions/` — server actions (gameplay mutations, family/account management)
- `lib/supabase/` — Supabase SSR clients (`server` / `client` / `admin` / `middleware`)
- `components/` — shared UI and shadcn primitives
- `lib/`, `store/`, `constants.ts`, `config/` — utilities, Zustand stores, gameplay constants, metadata
- `proxy.ts` — Next 16 middleware (locale redirect + Supabase session refresh)

See `CLAUDE.md` for a deeper architecture overview and important caveats.

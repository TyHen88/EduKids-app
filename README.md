# RomduolKids

A Duolingo-style learning app for kids. Pick a course (Khmer, English, or Math), work through units and lessons made of multiple-choice challenges, and track progress with hearts, XP, quests, and a leaderboard. The UI is bilingual (Khmer / English).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **Drizzle ORM** on **Neon** serverless Postgres
- **Clerk** authentication
- Custom **shadcn** admin panel (content management) with **SheetJS** Excel import
- **Zustand** for client-side modal state
- **Stripe** for subscriptions (currently stubbed — see `CLAUDE.md`)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file and fill it in:

   ```bash
   cp .env.example .env
   ```

   See `.env.example` for every variable and notes on the non-obvious ones.

3. Push the schema and seed the database:

   ```bash
   npm run db:push    # create tables from db/schema.ts
   npm run db:prod    # seed Khmer / English / Math courses (WIPES existing data)
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You'll be redirected to a locale (`/km` or `/en`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:fix` | Prettier |
| `npm run db:push` | Push `db/schema.ts` to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:prod` | Seed the database (deletes all data first) |

## Admin panel

The content-management UI lives at `/[lang]/admin` (e.g. `/en/admin`). Access is restricted to the Clerk user IDs listed in `CLERK_ADMIN_IDS`.

## Project layout

- `app/[lang]/` — all routes, scoped to a locale (`km` / `en`)
- `db/` — Drizzle schema, client, and cached read queries
- `actions/` — server actions (gameplay mutations)
- `components/` — shared UI and shadcn primitives
- `lib/`, `store/`, `constants.ts`, `config/` — utilities, Zustand stores, gameplay constants, metadata

See `CLAUDE.md` for a deeper architecture overview and important caveats.
# EduKids-app

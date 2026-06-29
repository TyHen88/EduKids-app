# 04 · Database (Neon Postgres)

The app uses **Drizzle ORM** on **Neon** via the serverless **HTTP driver** (`@neondatabase/serverless` + `drizzle-orm/neon-http`, see `db/drizzle.ts`). Schema is the single source of truth in **`db/schema.ts`** and is applied with **`drizzle-kit push`** — there are **no migration files**.

## Schema overview

`courses → units → lessons → challenges → challengeOptions`
plus `challengeProgress`, `userProgress` (hearts / points·"Stardust" / streak / **buddyName** / **buddyXp** / **lastChestAt** / active course), and `badges` + `userBadges` (collectible "star cards").

`challengesEnum` = `SELECT | ASSIST`.

## Step 1 — Create a production database

1. Neon → create a **project** (or a dedicated **branch** like `production`) separate from any dev data.
2. Copy the **pooled** connection string → `DATABASE_URL`.
3. Enable **SSL** (`?sslmode=require` is in the string by default).

> Keep dev and prod on **separate** Neon branches/projects so you never seed-wipe real data.

## Step 2 — Apply the schema

Point your local `.env` `DATABASE_URL` at the production database, then:

```bash
npm run db:push
```

This creates/updates all tables to match `db/schema.ts`. It's **additive and non-destructive** for new columns/tables. `drizzle-kit` may prompt on ambiguous renames — for a fresh database it just creates everything.

Verify with:

```bash
npm run db:studio   # opens Drizzle Studio against DATABASE_URL
```

## Step 3 — Seed content

You have two options:

### Option A — Admin panel (recommended for real content)
Sign in as an admin (`CLERK_ADMIN_IDS`) → `/[lang]/admin/courses` → **Create Course** → open a course's **Content** builder to add units → lessons → challenges → options. Nothing is wiped.

### Option B — Seed script (demo data, destructive)
```bash
npm run db:prod
```
⚠️ **`scripts/prod.ts` DELETES ALL DATA first**, then inserts demo Khmer/English/Math courses + a starter set of cosmic "star card" badges. **Never run against a database with real user progress.** Use it only to bootstrap an empty database, then switch to the admin panel.

> The demo seed is placeholder content (e.g. "Which one is the man?"). Replace it with your real curriculum before launch — see [06-code-changes-before-launch.md](./06-code-changes-before-launch.md).

## Badges / "star cards"

Stickers are the rows in the `badges` table; users earn the next un-owned one automatically when they complete a lesson for the first time (`actions/challenge-progress.ts`). Seed at least a handful of badges (the demo seed adds 8) so there's something to collect.

## Backups & safety

- Neon offers **point-in-time restore** / branching — enable/retain it for production.
- Before any `db:push` that changes existing columns, take a Neon branch snapshot.
- The HTTP driver is stateless and serverless-friendly (good for Vercel). For very high write volume, consider Neon autoscaling.

## Connection notes for Vercel

- Use the **pooled** Neon endpoint for the app (handles many short-lived serverless connections).
- The HTTP driver opens a connection per query, so no long-lived pool config is needed in code.

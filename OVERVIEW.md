# EduKids — Project Overview

**EduKids** is a **gamified, AI-assisted, multi-tenant kids' learning platform and content-authoring system** — bilingual (Khmer / English), built on Next.js 16 (App Router, Turbopack), React 19, TypeScript, Drizzle ORM on Supabase Postgres, and Supabase Auth.

It is **not** a simple gamified quiz app. It bundles four distinct applications into one codebase, each with its own shell, theme, and permission model.

## The four portals

| Portal | Audience | Accent theme | What it does |
|---|---|---|---|
| **(main)** — Learner | Kids | Indigo | Dashboard, "Star Map" learning path, lesson player, book library, achievements, friends |
| **(parent)** — Family | Parents / co-parents | Emerald / green | Manage children, author own courses & books, assign content, view PDF progress reports |
| **admin** — Admin | Platform admins | Indigo sidebar | Course/book authoring (CMS), user management, audit log, global settings |
| **(marketing) / (auth)** | Public | — | Landing page, email auth, and PIN-based **kids login** |

## Feature set

### Content authoring (CMS)
- Tiptap **rich-text editor** (headings, lists, links, resizable tables, inline images uploaded to Vercel Blob).
- Nested **course → unit → lesson → block** content editors; blocks are TEXT / IMAGE / SELECT / ASSIST.
- Multi-chapter **book** authoring for both admins (global) and parents (per-family).

### Learning & gamification ("Cosmic Explorer")
- Lesson player with hearts/lives, confetti, and scored results.
- Evolving **companion buddy** (Star Egg → Galactic Hero via XP), **Stardust** points economy, **daily reward chest**, **streaks**, badges ("Galaxy"), and a tiered **leaderboard**.

### Family / multi-tenancy
- Family groups with **PIN-based child accounts** (Supabase admin API) and invited **co-parents** with granular permissions.
- Parent-authored private courses & books, per-child **course assignment**.
- Printable / PDF **progress reports** (grades A–F, time spent, mistake review).

### Reading
- Multi-tenant **book library** (admin-global + per-family) with an immersive **Reader** (contents sidebar, keyboard nav, unit-by-unit or full-scroll modes).

### AI
- Google **Gemini 2.5 Flash** via Vercel AI SDK: streaming **chat assistant** (draft courses/quizzes) + one-shot **text "enhance"** (Sparkles button on inputs/editor) + floating Tools panel with AI chat and web image search.

### Platform infrastructure
- **Real-time** notifications (Ably) + **Web Push** (VAPID) with in-app notification history.
- **Login/activity audit log**, admin-controlled **background music/sounds**, friend requests & social clubs.
- Full **English + Khmer** i18n with dedicated Khmer font handling.

## Design / visual language
- **Playful "chunky-kid" UI** — tactile 3D buttons (`border-b-4` + press-down `active:translate-y-1`), pill / `rounded-[32px]` cards, soft shadows, gradient accents.
- **Space / cosmic theme** — Star Map path, Galaxy achievements, companion buddy, Stardust.
- **Indigo-600 primary** (`hsl(243 75% 59%)`) on slate-50, with **role-based accents** (learner = indigo, family = emerald, rewards = amber/gold). Custom **`romduol`** gold scale (Cambodia's national flower) as a brand token.
- **Fonts:** Nunito (Latin) + Battambang (Khmer), combined stacks so bilingual text always resolves.
- **Motion:** Framer Motion transitions, react-confetti, circular progress, buddy animations.

## Data model
20 Drizzle tables spanning learning content, progress analytics, family/multi-tenancy, gamification, social, notifications, and platform config. Single source of truth: [db/schema.ts](db/schema.ts).

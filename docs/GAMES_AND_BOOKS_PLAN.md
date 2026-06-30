# Games & Books — features draft

> **Status: DRAFT for confirmation.** Nothing here is built yet. This document
> proposes how to add **Games** (IQ, Fun Fun) and **Books reading** to the
> student app and reshuffle the Home page.

## Confirmed decisions

- **Audience:** **all students** (both regular learners and child accounts).
- **Books source:** **admin-uploaded** — DB tables + page-image upload via Vercel
  Blob, with an admin panel to manage them.
- **Game screen:** **full-screen**, like the lesson player (rendered outside the
  student shell, no nav/stats).
- **Game content:** **you will provide the specifics** for IQ and Fun Fun
  (rules/gameplay). So games are scaffolded now (Home card + full-screen route),
  and the actual gameplay is built once you describe each game.

## Goal

For kids in the student app:

1. **Games** — fun mini-games (e.g. **IQ**, **Fun Fun**) surfaced on **Home**.
   - No nav menu entry. Discovered from a Home card; tapping a game opens its
     play page.
2. **Books** — **reading** for kids.
   - Gets a **nav menu** entry **and** a Home card.
3. **Home cleanup** — **remove "Today's Goals"** (deemed unnecessary) and put the
   new **Games** and **Books** cards in its place.

## 1. Home page changes

File: [app/[lang]/(main)/learn/page.tsx](../app/[lang]/(main)/learn/page.tsx)

Current Home sections: Greeting → (optional rank card) → Buddy + Daily Chest →
**3-column grid**: left = _Continue Adventure_ + _Today's Goals_; right =
_Recent Rewards_ + _Friends/Family Club_.

Proposed:

- **Remove** the _Today's Goals_ `<section>` (lines ~320–381). Also drop the now
  unused `goals` / `goalsDone` computation and the `QUESTS` import if nothing
  else uses them.
- **Add two new cards** in its place (left column, under _Continue Adventure_):
  - **Games card** — title "Games" with two entry tiles: **IQ** and **Fun Fun**.
    Each tile links to its play page (see §2).
  - **Books card** — title "Books" / "Reading" with a few featured books and a
    "See all" link to the Books page (see §3).

ASCII sketch of the new left column:

```
┌──────────────────────────────────────┐
│ 🎯 Continue Adventure                 │  (unchanged)
│ [course art] Khmer · progress ...     │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 🎮 Games                              │
│  ┌─────────┐  ┌─────────┐             │
│  │  🧠 IQ  │  │ 🎉 Fun  │  → play     │
│  └─────────┘  └─────────┘             │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 📚 Books            [See all →]       │
│  [book] [book] [book]                 │
└──────────────────────────────────────┘
```

(_Recent Rewards_ and _Friends Club_ on the right are untouched.)

## 2. Games

- **Menu:** none (per request). Entry only from the Home _Games_ card.
- **Screen:** **full-screen** — rendered outside the student shell (like the
  lesson player), so no top/bottom nav while playing.
- **Placement:** `app/[lang]/games/` (a sibling of `lesson/`, NOT under
  `(main)`), with its own minimal layout and an "exit/back to Home" control.
- **Routes:**
  - `/[lang]/games/iq` — the IQ game.
  - `/[lang]/games/fun` — the Fun Fun game.
  - (Each game is its own page; a shared registry keeps the Home tiles in sync.)
- **Gameplay:** **awaiting your specifics.** For now I scaffold the Home tiles +
  full-screen routes with a placeholder "coming soon" canvas, then build each
  game's rules once you describe IQ and Fun Fun.

## 3. Books (reading)

- **Menu:** add a **Books** item to the student nav.
  - File: [components/main-shell.tsx](../components/main-shell.tsx) `studentLinks`
    (drives both desktop top-nav and mobile bottom-nav). Entry:
    `{ name: "Books", href: "/[lang]/books", icon: BookOpen }`.
- **Routes:**
  - `/[lang]/books` — library grid of published books (inside the shell).
  - `/[lang]/books/[bookId]` — the reader, page-by-page (likely **full-screen**
    for immersive reading — confirm if you'd prefer it inside the shell).
- **Placement:** `app/[lang]/(main)/books/` for the library; the reader can be
  full-screen under `app/[lang]/books/[bookId]/` if we want it immersive.
- **Content model:** **admin-uploaded** image-page picture books — a cover plus
  ordered page images stored in Vercel Blob (already configured).

## Data model (Books, admin-managed)

New Drizzle tables in [db/schema.ts](../db/schema.ts):

```
books        → id, title, coverSrc, category, language, isPublished,
               createdBy, createdAt
book_pages   → id, bookId (fk, cascade), order, imageSrc
```

Reading progress (optional, later): `book_progress(userId, bookId, lastPage)`.

Admin tooling mirrors the existing course manager
([app/[lang]/admin/courses](../app/[lang]/admin/courses)): a Books list +
create/edit form with multi-image upload to Blob. A new nav entry in the admin
sidebar.

## Rollout phases

1. **Home reshuffle** — remove _Today's Goals_; add the **Games** card (IQ + Fun
   Fun tiles → full-screen routes) and the **Books** card (featured + "See all").
   Add **Books** to the student menu.
2. **Books — schema + admin** — `books` / `book_pages` tables (`db:push`), admin
   Books CRUD with Blob page upload.
3. **Books — reader** — library grid + page-by-page reader for kids.
4. **Games — scaffold** — full-screen `/games/iq` and `/games/fun` routes with a
   placeholder canvas and exit control.
5. **Games — gameplay** — build IQ and Fun Fun from **your specifics**.
6. **Polish** — km/en dictionary keys, optional reading progress, empty states.

## Still needed from you

1. **Game specifics:** the rules/gameplay for **IQ** and **Fun Fun** (what the
   child sees and does, win/lose, scoring). Build starts on these once provided.
2. **Books reader screen:** **full-screen** immersive reader, or **inside the
   shell**? (Default in this draft: full-screen reader, library inside the shell.)
3. **i18n:** confirm labels — "Games", "IQ", "Fun Fun", "Books" — and whether
   Khmer translations are needed now or later.
```

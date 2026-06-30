# Sound & Music — build plan

> **Status: planned.** Today the Settings page ships a **UI-only** sound toggle
> ([app/[lang]/settings/settings-form.tsx](../app/[lang]/settings/settings-form.tsx))
> that persists to `localStorage` (`edukids-sound-enabled`) and does not yet drive
> any audio. The admin Settings page shows a non-interactive preview of the
> future controls. This document is the plan to make it real.

## Goal

Add sound effects (SFX) and background music to EduKids, with:

- A per-user **on/off** preference (already toggled in Settings, UI-only for now).
- **Volume** control(s) — separately for SFX and music.
- **Admin-side configuration** of which sounds/music are used, with **role-based
  defaults** (learner / parent / admin) and the ability for **parents to manage
  their children's** audio settings.

## Phases

### Phase 1 — Wire the existing toggle to real audio (client)
1. Create an `AudioProvider` (React context) mounted in `app/[lang]/layout.tsx`.
   - Reads the `edukids-sound-enabled` localStorage flag (and, later, the DB
     preference) and exposes `playSfx(name)` / `isSoundOn`.
   - Preload a small SFX set (correct, wrong, complete, click) under
     `public/audio/`. Use the Web Audio API or a tiny wrapper (e.g. `howler`).
2. Replace the localStorage-only `onToggleSound` in `settings-form.tsx` with the
   provider's setter so the toggle actually mutes/unmutes audio app-wide.
3. Call `playSfx(...)` from the quiz loop (`app/[lang]/lesson/quiz.tsx`):
   correct/wrong answer, lesson complete, heart lost.

### Phase 2 — Persist the preference (server)
1. Schema: add to `user_progress` (mirrors the existing `notifications_enabled`):
   - `sound_enabled boolean default true`
   - `music_enabled boolean default true`
   - `sfx_volume integer default 80` (0–100), `music_volume integer default 50`
2. Server action `actions/settings.ts` → `updateSoundPreferences({...})`.
3. Settings page reads these from `getUserProgress()` and seeds the form
   (replace the localStorage source). Run `npm run db:push`.

### Phase 3 — Background music
1. Add a looping, low-volume track (menu vs. in-lesson variants).
2. Respect autoplay policies: start music only after the first user gesture.
3. Gate behind `music_enabled` + `music_volume`.

### Phase 4 — Admin-side configuration (role-based)
1. New table `audio_settings` (or a JSON config) for platform defaults:
   - selected SFX pack, default music track, default volumes.
   - **role-based** overrides: defaults per `learner | parent | admin`.
2. Admin Settings page (`app/[lang]/admin/settings/page.tsx`) — replace the
   current static preview with live controls (upload/select tracks via Vercel
   Blob, set default volumes per role).
3. Resolution order at runtime: **user preference → role default → platform
   default**.

### Phase 5 — Parents manage children (exceptional children)
1. Parents can view/override each child's sound & music settings from the family
   dashboard (`app/[lang]/(parent)/family/children/[childId]`).
2. A child's effective settings = child's own value if set, else the parent's
   chosen default for that child, else the role default.
3. Reuse the `Switch` component and the same server actions, scoped by `childId`
   (parent authorization checked server-side — see the IDOR note in
   `SUPABASE_SETUP.md`).

## Roles recap

| Role    | Can change own audio | Can configure others                          |
| ------- | -------------------- | --------------------------------------------- |
| learner | yes                  | —                                             |
| parent  | yes                  | their children's audio settings               |
| admin   | yes                  | platform defaults + role-based defaults        |

## Assets & dependencies

- `public/audio/` — SFX + music files (keep small; prefer `.ogg`/`.mp3`).
- Optional: `howler` for cross-browser audio (or hand-rolled Web Audio).
- Vercel Blob (already configured) for admin-uploaded tracks.

## Open questions

- Bundle a fixed SFX pack vs. admin-uploadable packs?
- One global music track or per-course themes?
- Accessibility: respect `prefers-reduced-motion`/OS "reduce sound" hints?

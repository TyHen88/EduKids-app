# 07 · Pre-Launch Checklist

A single go/no-go list. Tick every box before opening to real users.

## Infrastructure
- [ ] Neon **production** database created (separate from dev), `DATABASE_URL` is the **pooled** string.
- [ ] `npm run db:push` run against the production DB — all tables exist (verify in `db:studio`).
- [ ] Real course content created (admin panel) **or** seed reviewed; `db:prod` will **not** be run again on the populated DB.
- [ ] Neon backups / branching / point-in-time restore enabled.

## Clerk
- [ ] Clerk **Production** instance active with **custom domain** verified (DNS).
- [ ] **Email + Password** enabled; **Email verification code** (6-digit, not link) enabled.
- [ ] **Google OAuth** enabled with your **own** Google Cloud credentials + correct redirect URI.
- [ ] Bot sign-up protection decision made (on for prod recommended).
- [ ] Production keys (`pk_live` / `sk_live`) in env.
- [ ] `CLERK_ADMIN_IDS` populated with **production** user IDs.

## Environment
- [ ] All env vars set in Vercel for **Production** (and Preview if used).
- [ ] `NEXT_PUBLIC_APP_URL` = the real domain.
- [ ] No secrets committed; `.env` is git-ignored.

## Code cleanups (see [06](./06-code-changes-before-launch.md))
- [ ] Promo banner removed or replaced.
- [ ] `config/index.ts` author/links/email/keywords updated to your brand.
- [ ] Theme color set to indigo.
- [ ] Favicon/icons/OG image swapped to EduKids branding.
- [ ] Default locale confirmed (`km` vs `en`).

## Build & quality
- [ ] `npm run lint` clean.
- [ ] `npm run typecheck` clean.
- [ ] `npm run build` succeeds.
- [ ] Vercel production build green.

## Functional smoke test (on the live domain)
- [ ] `/` redirects to `/<locale>` and the landing page loads.
- [ ] **Sign up** (email) → receive **6-digit code** → auto-verify → land on `/learn`.
- [ ] **Sign in** (email) works; wrong password shows a friendly error.
- [ ] **Forgot password** → code → new password → signed in.
- [ ] **Continue with Google** → lands on `/learn` (no hosted-page bounce).
- [ ] Pick a course → **Learn** dashboard renders (buddy + daily chest + goals).
- [ ] **Star Journey** (`/path`) renders; start a lesson.
- [ ] Quiz: correct **auto-advances**, wrong lets you re-pick, **combo** "On fire!" shows, finish screen + confetti.
- [ ] Daily chest opens (once/day); streak updates.
- [ ] **Profile**: change name/avatar (preset **and** photo upload), rename buddy, save persists; **Sign out** works.
- [ ] **Galaxy Collection** shows earned star cards after finishing a lesson.
- [ ] **Admin** (`/admin`) reachable only by `CLERK_ADMIN_IDS`; non-admins are redirected.
- [ ] Admin: create/edit/delete a course; content builder (units→lessons→challenges→options) saves.
- [ ] Language switch (km/en) works across pages.

## Performance / SEO / a11y
- [ ] Lighthouse run (mobile) — acceptable scores.
- [ ] OG/Twitter meta present for shared links.
- [ ] Images load (no `next/image` unconfigured-host errors in console).

## Legal / product (kids app)
- [ ] Privacy policy + terms linked (children's data — review COPPA/GDPR-K as applicable).
- [ ] Decision on photo uploads (presets-only vs allow uploads) — uploads are **not** auto-moderated (see [08](./08-security-and-caveats.md)).
- [ ] Support/contact channel set.

## Known caveats acknowledged (see [08](./08-security-and-caveats.md))
- [ ] **Billing is stubbed** — hearts effectively unlimited, no payments. Acceptable for launch, or implement billing first.

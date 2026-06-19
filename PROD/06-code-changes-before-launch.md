# 06 · Code Changes Before Launch

App-specific cleanups. This project was adapted from a template (`duolingo-clone`) and merged from a prototype, so a few **leftover bits must be edited** before a public launch. Each item is tagged **REQUIRED** / **RECOMMENDED** / **OPTIONAL**.

---

## 1. Promo banner — REQUIRED

`components/banner.tsx` shows a leftover message:

> "Account creation is currently not working due to Clerk's 500-user limit. To try it out, please **fork this repo** or **Contact me** for access."

It **auto-shows for first-time visitors** (it un-hides on mount when no `localStorage` flag is set). This is not appropriate for production.

**Do one of:**
- **Remove it:** delete `<Banner … />` from `app/[lang]/(marketing)/header.tsx` and `app/[lang]/(auth)/header.tsx`, and delete `components/banner.tsx`; or
- **Replace the copy** with a real announcement (or make it default-hidden).

---

## 2. Fork / author metadata — REQUIRED

`config/index.ts` still points at the original author and template repo:

```ts
authors: { name: "Sanidhya Kumar Verma", url: "https://github.com/sanidhyy" },
// ...
export const links = {
  sourceCode: "https://github.com/sanidhyy/duolingo-clone",
  email: "sanidhya.verma12345@gmail.com",
};
```

`links.sourceCode` / `links.email` are surfaced in the banner/header. Update `authors`, `links.sourceCode`, and `links.email` to your own org/support details. Also review the `keywords` array (still contains `duolingo-clone`, `romduolkids`) for SEO.

---

## 3. Theme color — RECOMMENDED

`app/[lang]/layout.tsx` sets the browser theme color to amber:

```ts
export const viewport: Viewport = { themeColor: "#D97706" };
```

Change to the EduKids indigo to match branding:

```ts
export const viewport: Viewport = { themeColor: "#4f46e5" };
```

---

## 4. Demo seed content — REQUIRED (replace) 

`scripts/prod.ts` (`npm run db:prod`) inserts **placeholder** courses (Khmer/English/Math with sample "Which one is the man?" challenges). For a real product:

- Use it only to bootstrap an empty DB, then build real curriculum via the **admin panel** (`/[lang]/admin`), **or**
- Edit `scripts/prod.ts` to seed your real content.

Remember: `db:prod` **wipes all data** — never run it against a populated production DB. See [04-database-neon.md](./04-database-neon.md).

---

## 5. Stale env references — RECOMMENDED (cleaned)

Stripe billing was removed/stubbed, but two files still referenced it:

- `.env.example` — listed `STRIPE_API_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` and a removed `/api/*` admin note.
- `environment.d.ts` — declared the Stripe vars as required.

These have been **cleaned in this pass** (see the updated files). If you re-introduce billing later, restore them. Billing status itself is covered in [08-security-and-caveats.md](./08-security-and-caveats.md).

---

## 6. App README — OPTIONAL

The root `README.md` / `CLAUDE.md` / `AGENTS.md` are developer docs (CLAUDE.md was updated to describe EduKids). Review the public-facing `README.md` if the repo is public.

---

## 7. Favicon / icons / OG — RECOMMENDED

`app/favicon.ico`, `app/icon1.png`, `app/icon2.png`, `app/apple-icon.png`, `app/Logo.png` may still be template art. Swap in EduKids branding and add an Open Graph image for link previews.

---

## 8. Locale default — OPTIONAL

Default locale is **`km`** (Khmer) in `app/[lang]/dictionaries.ts` and `proxy.ts`. If your primary audience is English, change `defaultLocale` in **both** files to `"en"` (keep them in sync — and remember the Khmer file is `dictionaries/kh.json`, not `km.json`).

---

## Quick pre-launch grep

```bash
# leftover template references
grep -rin "sanidhyy\|duolingo-clone\|romduol\|fork this repo" Final-app --exclude-dir=node_modules --exclude-dir=.next
# stripe leftovers (should only be comments, if any)
grep -rin "stripe" Final-app --exclude-dir=node_modules --exclude-dir=.next
```

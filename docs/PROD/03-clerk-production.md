# 03 · Clerk Production Setup

This app uses Clerk's **Future/Signals API** (`@clerk/nextjs` v7) with **fully custom** auth pages:

- `/[lang]/sign-in` · `/[lang]/sign-up` · `/[lang]/forgot-password` · `/[lang]/sso-callback`
- Components: `components/auth/*`, helper `lib/clerk-error.ts`
- `<ClerkProvider>` (in `app/[lang]/layout.tsx`) sets `signInUrl`, `signUpUrl`, `signInFallbackRedirectUrl`, `signUpFallbackRedirectUrl`, `afterSignOutUrl`.

Because the flows are custom, the Clerk **dashboard must be configured to match** or the forms will error.

## Step 1 — Create the Production instance

1. Clerk Dashboard → your application → switch the instance toggle to **Production**.
2. Clerk will ask you to set a **custom domain** (e.g. `clerk.edukids.app`). Add the **CNAME / DNS records** Clerk shows you at your domain registrar. Wait for verification (can take minutes–hours).
3. Copy the **production API keys**: `pk_live_…` and `sk_live_…` → put in env (see [02](./02-environment-variables.md)).

> Production keys are different from development. Production **user IDs are also different**, so your `CLERK_ADMIN_IDS` must use prod IDs.

## Step 2 — Enable Email + Password with email **code**

**Configure → Email, phone, username**

- **Contact information** → enable **Email address** (Required).
- **Authentication strategies** → enable **Password**.
- Open **Email address → Verification methods** → enable **Email verification code** (the 6-digit code, **not** the magic link).

This powers:
- Sign-up email verification (`signUp.verifications.sendEmailCode` / `verifyEmailCode`)
- Password reset (`signIn.resetPasswordEmailCode.sendCode` / `verifyCode` / `submitPassword`)

If "Email verification code" is off, sign-up and forgot-password will fail.

## Step 3 — Enable Google OAuth

**Configure → SSO connections** (older UI: **Social connections**) → **Add connection → For all users → Google**.

- On **Production**, you must supply **your own** Google OAuth credentials:
  1. Google Cloud Console → create an **OAuth 2.0 Client ID** (type: Web application).
  2. Add the **Authorized redirect URI** Clerk shows you (looks like `https://clerk.edukids.app/v1/oauth_callback`).
  3. Paste the **Client ID** and **Client Secret** back into Clerk.
- The app initiates OAuth with `signIn.sso({ strategy: "oauth_google", redirectUrl: "/[lang]/learn", redirectCallbackUrl: ".../[lang]/sso-callback" })` and finalizes on the `/sso-callback` page.

## Step 4 — Bot protection (optional but recommended)

**Configure → Attack protection → Bot sign-up protection.** The sign-up page already includes the `<div id="clerk-captcha" />` mount, so Smart CAPTCHA works automatically when enabled. Turn off only if it blocks legitimate testing.

## Step 5 — Branding & redirects

- **Customize → Appearance** (and the app's `appearance` prop) — `colorPrimary` is set to indigo `#4f46e5` in `app/[lang]/layout.tsx`.
- **Paths/redirects:** the app handles these in code (`signInUrl`, fallbacks → `/[lang]/learn`). Make sure any dashboard "Paths" settings don't fight the locale-prefixed routes.

## Step 6 — Find admin user IDs

After someone signs in on production: Clerk Dashboard → **Users** → open the user → copy the **User ID** (`user_…`). Put it in `CLERK_ADMIN_IDS` (comma **and space** separated) and redeploy.

## Gotchas (already handled in code — don't regress)

- **Future API:** `useSignIn()/useSignUp()` return `{ signIn|signUp, errors, fetchStatus }` — **no** `isLoaded`/`setActive`. Methods return `{ error }` (don't throw); you call `.finalize({ navigate })` to activate the session.
- **Two-step verify needs a pinned instance:** the send step and verify step must use the **same** `signIn`/`signUp` resource instance (stored in a `useRef`), or Clerk throws "You need to send a verification code before attempting to verify." This is implemented in the sign-up and forgot-password pages.
- **Dev OAuth flash:** the brief `*.accounts.dev` redirect only happens on dev instances; it disappears on production with your custom domain.

## Quick verification after setup

1. `/[lang]/sign-up` → create a test account → you should receive a **6-digit code** email (not a link) → auto-verifies → lands on `/[lang]/learn`.
2. `/[lang]/forgot-password` → request code → enter it → set new password → signed in.
3. `/[lang]/sign-in` → "Continue with Google" → lands on `/[lang]/learn` with no hosted-page bounce.

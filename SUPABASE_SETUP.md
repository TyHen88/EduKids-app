# Supabase Auth setup

Auth was migrated from Clerk to **Supabase Auth** (`@supabase/ssr`). The code is
complete and type-checks, but it needs a Supabase project + the steps below to
run end-to-end. The app **database stays on Neon** — Supabase is used only for
authentication. `userProgress.userId` now stores the Supabase auth user UUID.

## 1. Create a Supabase project & set env vars

1. Create a project at https://supabase.com.
2. Project Settings → **API**, copy into `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server-only, bypasses RLS
   ```
   The service-role key is used by `lib/supabase/admin.ts` for parent-created
   child accounts (`actions/family.ts`) and username lookups (`db/queries.ts`).
   **Never expose it to the browser.**

## 2. Auth providers & URLs (Supabase dashboard → Authentication)

- **Email**: enable Email provider. Enable "Confirm email" if you want the
  sign-up OTP step (the app expects it).
- **Google**: Providers → Google → enable, add your Google OAuth client
  ID/secret. The app uses PKCE; the callback route is
  `/{locale}/sso-callback` (handled by `app/[lang]/(auth)/sso-callback/route.ts`).
- **URL Configuration → Redirect URLs**: add
  `http://localhost:3001/**` (dev) and `https://<your-domain>/**` (prod) so the
  OAuth/recovery redirects are allowed.

## 3. Email templates → make them send a 6-digit CODE (not a link)

The sign-up and forgot-password flows use **OTP codes** (`verifyOtp`), so the
emails must include the token, not just a magic link. In
**Authentication → Email Templates**, edit the **Confirm signup** and
**Reset password** templates to include:

```
{{ .Token }}
```

(e.g. "Your code is {{ .Token }}"). Without this, users won't receive the code
the UI asks for.

## 4. Admin accounts

`ADMIN_IDS` is a comma-AND-space separated list of Supabase user UUIDs
(`lib/admin.ts` splits on `", "`). Sign in once, find your UUID in
Authentication → Users, then:

```
ADMIN_IDS=11111111-1111-1111-1111-111111111111, 22222222-2222-2222-2222-222222222222
```

## 5. Run

```
npm run db:push     # ensure the Neon schema exists (unchanged by this migration)
npm run dev
```

## Flow → API mapping (for reference)

| Flow | File | Supabase call |
|------|------|---------------|
| Email sign-in | `(auth)/sign-in/page.tsx` | `signInWithPassword` |
| Email sign-up + verify | `(auth)/sign-up/page.tsx` | `signUp` → `verifyOtp({ type: 'signup' })` |
| Forgot password | `(auth)/forgot-password/page.tsx` | `resetPasswordForEmail` → `verifyOtp({ type: 'recovery' })` → `updateUser({ password })` |
| Google OAuth | `components/auth/google-button.tsx` + `sso-callback/route.ts` | `signInWithOAuth({ provider: 'google' })` → `exchangeCodeForSession` |
| Kids PIN login | `(auth)/kids-login/page.tsx` | `signInWithPassword` (synthetic email + PIN password) |
| Create/remove child | `actions/family.ts` | `admin.createUser` / `admin.deleteUser` |
| Sign out | `lib/use-sign-out.ts` | `signOut` |
| Server `auth()` / `currentUser()` | `lib/auth.ts` | `supabase.auth.getUser()` |

## Security notes carried over from the pre-migration review

These pre-existing issues were **preserved as-is** by the migration (not fixed)
and are worth addressing separately:

- `createChildAccount` does not verify the caller is a parent.
- Child passwords are PIN-derived with a hardcoded suffix (low entropy).
- `notifications.ts` actions take an arbitrary `userId` with no auth check.
- `content.ts` / `lesson-block.ts` editor guard checks the passed `courseId`,
  not the entity's real owning course (IDOR).
- `acceptFriendRequest` doesn't verify a pending request exists.

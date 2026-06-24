import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { recordAuthCallback } from "@/actions/audit";

/**
 * OAuth callback. Google (via Supabase) redirects here with a `code` we
 * exchange for a session, then forward the user to `next`. Replaces Clerk's
 * <AuthenticateWithRedirectCallback> page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  // The locale is the first segment of `next` (e.g. "/km/learn" → "km").
  const locale = next.split("/")[1] || "km";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Record the auth event for the admin audit log (best-effort). This route
      // handles BOTH Google OAuth and email-confirmation links, so derive the
      // method from the provider (email confirmation → "email", not "google").
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const provider = (user.app_metadata?.provider as string) || "email";
        const loginType = provider === "google" ? "google" : "email";
        await recordAuthCallback(user.id, loginType, user.email);
      }

      // ?welcome=1 triggers the post-login welcome toast on the destination
      // (WelcomeToast reads it, then strips it from the URL).
      const dest = new URL(`${origin}${next}`);
      dest.searchParams.set("welcome", "1");
      return NextResponse.redirect(dest);
    }
  }

  // No code or exchange failed → back to sign-in.
  return NextResponse.redirect(`${origin}/${locale}/sign-in`);
}

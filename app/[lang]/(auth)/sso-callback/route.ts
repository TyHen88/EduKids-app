import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code or exchange failed → back to sign-in.
  return NextResponse.redirect(`${origin}/${locale}/sign-in`);
}

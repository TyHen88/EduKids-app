import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every matched request and writes the
 * rotated auth cookies onto the outgoing response. Required for SSR auth — see
 * https://supabase.com/docs/guides/auth/server-side/nextjs. Called from
 * proxy.ts. `response` is passed in so the caller can attach other headers
 * (e.g. a locale rewrite) to the same response object.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet, don't crash every route — skip the
  // session refresh and let pages render (unauthenticated). Fix .env to enable
  // auth. See SUPABASE_SETUP.md.
  if (!url?.startsWith("http") || !anonKey) {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing or invalid — skipping session refresh."
    );
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser() —
  // it refreshes the session and must happen before any auth-dependent logic.
  await supabase.auth.getUser();

  return response;
}

import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const locales = ["km", "en"] as const;
const defaultLocale = "km" as const;

function getLocale(request: NextRequest): "km" | "en" {
  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.includes("km")) return "km";
  if (acceptLang.includes("en")) return "en";
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // Missing locale prefix → redirect (no need to refresh the session first).
  if (!hasLocale) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // Locale present → refresh the Supabase auth session and forward cookies.
  const response = NextResponse.next({ request });
  return updateSession(request, response);
}

export const config = {
  matcher: [
    "/((?!_next|static|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.wav$|.*\\.mp3$).*)",
  ],
};

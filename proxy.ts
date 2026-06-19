import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const locales = ["km", "en"] as const;
const defaultLocale = "km" as const;

function getLocale(request: Request): "km" | "en" {
  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.includes("km")) return "km";
  if (acceptLang.includes("en")) return "en";
  return defaultLocale;
}

export default clerkMiddleware((auth, request) => {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return;
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
});

export const config = {
  matcher: ["/((?!_next|static|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.wav$|.*\\.mp3$).*)"],
};

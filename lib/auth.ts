import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth helpers backed by Supabase Auth. These replace Clerk's
 * `auth()` / `currentUser()` from "@clerk/nextjs/server" and keep the same
 * call shape so server actions / queries only change their import.
 *
 * `auth()` returns the user id (Supabase auth UUID), which is what every
 * `userProgress.userId` row and its foreign keys are keyed on.
 */

/**
 * Raw Supabase user (or null). Wrapped in React `cache()` so the network call
 * to Supabase Auth runs at most once per request, even though many queries /
 * layouts call auth() — this keeps pages that fetch a lot from crawling.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Clerk-compatible shim: `const { userId } = await auth()`. */
export const auth = async (): Promise<{ userId: string | null }> => {
  const user = await getCurrentUser();
  return { userId: user?.id ?? null };
};

/** Normalized profile fields, mapped from Supabase user + user_metadata. */
export type AppUser = {
  id: string;
  email: string | null;
  /** Display name (Clerk's `firstName` equivalent). */
  firstName: string | null;
  /** Avatar URL (Clerk's `imageUrl` equivalent). */
  imageUrl: string | null;
  username: string | null;
};

/** Clerk-compatible shim for `currentUser()`, normalized to AppUser. */
export const currentUser = async (): Promise<AppUser | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);

  // Email/password sign-ups carry no name in metadata. Fall back to the local
  // part of the email (e.g. "henthevath@gmail.com" → "henthevath") so new
  // profiles get a sensible name instead of the generic "User" default.
  const emailLocalPart = user.email ? user.email.split("@")[0] || null : null;

  return {
    id: user.id,
    email: user.email ?? null,
    firstName:
      str(meta.full_name) ??
      str(meta.name) ??
      str(meta.firstName) ??
      str(meta.user_name) ??
      emailLocalPart,
    imageUrl: str(meta.avatar_url) ?? str(meta.picture) ?? null,
    username: str(meta.username) ?? str(meta.user_name) ?? null,
  };
};

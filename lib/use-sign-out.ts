"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { recordLogout } from "@/actions/audit";
import { useLocale } from "@/app/[lang]/lang-provider";

/**
 * Returns a `signOut(redirectTo?)` callback that clears the Supabase session
 * and navigates away (defaults to the locale landing page). Replaces Clerk's
 * `useClerk().signOut`.
 */
export function useSignOut() {
  const router = useRouter();
  const locale = useLocale();

  return useCallback(
    async (redirectTo?: string) => {
      const supabase = createClient();
      // Record the logout while the session cookie is still valid.
      await recordLogout().catch(() => {});
      await supabase.auth.signOut();
      router.push(redirectTo ?? `/${locale}`);
      router.refresh();
    },
    [router, locale]
  );
}

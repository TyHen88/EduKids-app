import { redirect } from "next/navigation";

import { getUserProgress } from "@/db/queries";

/**
 * Redirects deactivated users to the in-app /deactivated page. Call from any
 * authenticated layout. Returns the user's progress so callers can reuse it
 * (getUserProgress is React-cached, so this doesn't double-fetch).
 */
export const guardActiveUser = async (lang: string) => {
  const userProgress = await getUserProgress();
  if (userProgress && !userProgress.isActive) {
    redirect(`/${lang}/deactivated`);
  }
  return userProgress;
};

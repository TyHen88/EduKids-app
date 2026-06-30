"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { userProgress, audioSettings } from "@/db/schema";

/**
 * Toggle whether this user receives web-push notifications. In-app notification
 * history is unaffected; this only gates push delivery (see sendPushNotification).
 */
export const setNotificationsEnabled = async (
  enabled: boolean,
  lang: string = "en"
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(userProgress)
    .set({ notificationsEnabled: enabled })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/${lang}/settings`);
  return { success: true };
};

/**
 * Update the global, admin-managed background-music config (single row, id=1).
 * Admin-only. When disabled, learners get no music and the toggle icon hides.
 * `musicVolume` is clamped to 0–100.
 */
export const updateAudioSettings = async (
  input: { musicEnabled: boolean; musicVolume: number },
  lang: string = "en"
) => {
  if (!(await getIsAdmin())) throw new Error("Unauthorized");

  const musicEnabled = !!input.musicEnabled;
  const musicVolume = Math.max(
    0,
    Math.min(100, Math.round(Number(input.musicVolume) || 0))
  );

  await db
    .insert(audioSettings)
    .values({ id: 1, musicEnabled, musicVolume, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: audioSettings.id,
      set: { musicEnabled, musicVolume, updatedAt: new Date() },
    });

  // Admin page (live form) + the whole student app shell, which reads these on
  // the server to gate the music + toggle icon.
  revalidatePath(`/${lang}/admin/settings`);
  revalidatePath(`/${lang}`, "layout");
  return { success: true, musicEnabled, musicVolume };
};

/** Record that this user now has a password (set/changed via Settings). */
export const markPasswordSet = async () => {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .update(userProgress)
    .set({ passwordSet: true })
    .where(eq(userProgress.userId, userId));
};

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { userProgress } from "@/db/schema";

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

/** Record that this user now has a password (set/changed via Settings). */
export const markPasswordSet = async () => {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .update(userProgress)
    .set({ passwordSet: true })
    .where(eq(userProgress.userId, userId));
};

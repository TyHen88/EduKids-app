"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import { userProgress } from "@/db/schema";
import { FEED_COST, FEED_XP } from "@/lib/buddy";

// Feed the companion buddy: spend Stardust (points) for buddy XP.
export const feedBuddy = async (lang = "km") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");

  const progress = await getUserProgress();
  if (!progress) throw new Error("User progress not found.");

  if (progress.points < FEED_COST) return { error: "stardust" as const };

  await db
    .update(userProgress)
    .set({
      points: progress.points - FEED_COST,
      buddyXp: progress.buddyXp + FEED_XP,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/${lang}/learn`);
  return { ok: true as const, gainedXp: FEED_XP };
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Open the daily surprise chest: grants Stardust scaled by streak, and
// advances/resets the daily streak.
export const openDailyChest = async (lang = "km") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");

  const progress = await getUserProgress();
  if (!progress) throw new Error("User progress not found.");

  const now = new Date();
  const last = progress.lastChestAt ? new Date(progress.lastChestAt) : null;
  const today = startOfDay(now);

  if (last && startOfDay(last) === today) {
    return { error: "claimed" as const };
  }

  const ONE_DAY = 86_400_000;
  let newStreak = 1;
  if (last) {
    const diff = today - startOfDay(last);
    newStreak = diff === ONE_DAY ? progress.streak + 1 : 1;
  }

  const streakBonus = Math.min(newStreak, 7) * 5;
  const randomBonus = Math.floor(Math.random() * 11); // 0–10 surprise
  const reward = 10 + streakBonus + randomBonus;

  await db
    .update(userProgress)
    .set({
      points: progress.points + reward,
      streak: newStreak,
      lastChestAt: now,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/${lang}/learn`);
  return { ok: true as const, reward, streak: newStreak };
};

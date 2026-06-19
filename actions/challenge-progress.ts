"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { MAX_HEARTS } from "@/constants";
import { LESSON_XP } from "@/lib/buddy";
import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import {
  challengeProgress,
  challenges,
  userBadges,
  userProgress,
} from "@/db/schema";

// Cosmic Explorer — award the next un-collected sticker (badge) when the user
// finishes every challenge in a lesson for the first time.
const awardStickerIfLessonComplete = async (
  userId: string,
  lessonId: number
) => {
  const lessonChallenges = await db.query.challenges.findMany({
    where: eq(challenges.lessonId, lessonId),
    columns: { id: true },
  });

  if (lessonChallenges.length === 0) return;

  const completed = await db.query.challengeProgress.findMany({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.completed, true)
    ),
    columns: { challengeId: true },
  });
  const completedIds = new Set(completed.map((c) => c.challengeId));

  const lessonComplete = lessonChallenges.every((c) => completedIds.has(c.id));
  if (!lessonComplete) return;

  const [allStickers, owned] = await Promise.all([
    db.query.badges.findMany({ orderBy: (b, { asc }) => [asc(b.id)] }),
    db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
      columns: { badgeId: true },
    }),
  ]);

  const ownedIds = new Set(owned.map((o) => o.badgeId));
  const next = allStickers.find((s) => !ownedIds.has(s.id));
  if (!next) return; // collected them all

  await db.insert(userBadges).values({ userId, badgeId: next.id });
};

export const upsertChallengeProgress = async (challengeId: number) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) throw new Error("User progress not found.");

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) throw new Error("Challenge not found.");

  const lessonId = challenge.lessonId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (
    currentUserProgress.hearts === 0 &&
    !isPractice &&
    !userSubscription?.isActive
  )
    return { error: "hearts" };

  if (isPractice) {
    await db
      .update(challengeProgress)
      .set({
        completed: true,
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    await db
      .update(userProgress)
      .set({
        hearts: Math.min(currentUserProgress.hearts + 1, MAX_HEARTS),
        points: currentUserProgress.points + 10,
        buddyXp: currentUserProgress.buddyXp + LESSON_XP,
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath(`/learn`);
    revalidatePath(`/lesson`);
    revalidatePath(`/achievements`);
    revalidatePath(`/lesson/${lessonId}`);
    return;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10,
      buddyXp: currentUserProgress.buddyXp + LESSON_XP,
    })
    .where(eq(userProgress.userId, userId));

  // First-time lesson completion drops a collectible sticker.
  await awardStickerIfLessonComplete(userId, lessonId);

  revalidatePath(`/learn`);
  revalidatePath(`/lesson`);
  revalidatePath(`/achievements`);
  revalidatePath(`/lesson/${lessonId}`);
};

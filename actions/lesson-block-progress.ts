"use server";

import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { MAX_HEARTS } from "@/constants";
import { LESSON_XP } from "@/lib/buddy";
import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import {
  lessonBlockProgress,
  lessonBlocks,
  userBadges,
  userProgress,
} from "@/db/schema";

// Cosmic Explorer — award the next un-collected sticker (badge) when the user
// finishes every block in a lesson for the first time.
const awardStickerIfLessonComplete = async (
  userId: string,
  lessonId: number
) => {
  const lessonBlocksData = await db.query.lessonBlocks.findMany({
    where: eq(lessonBlocks.lessonId, lessonId),
    columns: { id: true },
  });

  if (lessonBlocksData.length === 0) return;

  const completed = await db.query.lessonBlockProgress.findMany({
    where: and(
      eq(lessonBlockProgress.userId, userId),
      eq(lessonBlockProgress.completed, true)
    ),
    columns: { blockId: true },
  });
  const completedIds = new Set(completed.map((c) => c.blockId));

  const lessonComplete = lessonBlocksData.every((c) => completedIds.has(c.id));
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

export const upsertLessonBlockProgress = async (blockId: number) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) throw new Error("User progress not found.");

  const block = await db.query.lessonBlocks.findFirst({
    where: eq(lessonBlocks.id, blockId),
  });

  if (!block) throw new Error("Block not found.");

  const lessonId = block.lessonId;

  const existingBlockProgress = await db.query.lessonBlockProgress.findFirst({
    where: and(
      eq(lessonBlockProgress.userId, userId),
      eq(lessonBlockProgress.blockId, blockId)
    ),
  });

  const isPractice = !!existingBlockProgress;

  if (
    currentUserProgress.hearts === 0 &&
    !isPractice &&
    !userSubscription?.isActive
  )
    return { error: "hearts" };

  if (isPractice) {
    await db
      .update(lessonBlockProgress)
      .set({
        completed: true,
      })
      .where(eq(lessonBlockProgress.id, existingBlockProgress.id));

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

  await db.insert(lessonBlockProgress).values({
    blockId,
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

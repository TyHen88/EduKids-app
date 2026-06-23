"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { MAX_HEARTS, POINTS_TO_REFILL } from "@/constants";
import db from "@/db/drizzle";
import {
  getCourseById,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";
import { lessonBlockProgress, lessonBlocks, userProgress } from "@/db/schema";

export const upsertUserProgress = async (courseId: number, lang = "km") => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error("Unauthorized.");

  const course = await getCourseById(courseId);

  if (!course) throw new Error("Course not found.");

  // A course is playable if ANY unit has at least one lesson. The old check only
  // looked at the first unit, so a course whose first unit was empty (but had
  // lessons in a later unit) threw "Course is empty." — surfacing as a
  // "Something went wrong." toast in the Backpack even though the card was
  // enabled (the card counts lessons across all units).
  const hasLessons = course.units.some((unit) => unit.lessons.length > 0);
  if (!hasLessons) throw new Error("Course is empty.");

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress) {
    await db
      .update(userProgress)
      .set({
        activeCourseId: courseId,
        userName: user.firstName || "User",
        userImageSrc: user.imageUrl || "/mascot.svg",
      })
      .where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({
      userId,
      activeCourseId: courseId,
      userName: user.firstName || "User",
      userImageSrc: user.imageUrl || "/mascot.svg",
    });
  }

  // Navigation is done by the caller via useRouter. We must NOT redirect() here:
  // redirect() works by throwing NEXT_REDIRECT, which the client's .catch() would
  // swallow as a generic error (showing the "Something went wrong." toast).
  revalidatePath(`/${lang}/courses`);
  revalidatePath(`/${lang}/learn`);
};

export const reduceHearts = async (blockId: number) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

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

  if (isPractice) return { error: "practice" };

  if (!currentUserProgress) throw new Error("User progress not found.");

  if (userSubscription?.isActive) return { error: "subscription" };

  if (currentUserProgress.hearts === 0) return { error: "hearts" };

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};

export const refillHearts = async () => {
  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress) throw new Error("User progress not found.");
  if (currentUserProgress.hearts === MAX_HEARTS)
    throw new Error("Hearts are already full.");
  if (currentUserProgress.points < POINTS_TO_REFILL)
    throw new Error("Not enough points.");

  await db
    .update(userProgress)
    .set({
      hearts: MAX_HEARTS,
      points: currentUserProgress.points - POINTS_TO_REFILL,
    })
    .where(eq(userProgress.userId, currentUserProgress.userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};

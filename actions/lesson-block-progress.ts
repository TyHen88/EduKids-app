"use server";

import { auth } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { MAX_HEARTS } from "@/constants";
import { LESSON_XP } from "@/lib/buddy";
import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import { notifyUser } from "@/actions/notifications";
import {
  lessonBlockProgress,
  lessonBlocks,
  userBadges,
  userProgress,
  familyMembers,
  units,
  lessons,
  courses,
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

// When a CHILD completes the final block of their course, alert the linked
// parent (in-app + web push). Only fires for child accounts (familyMembers link)
// and only once — when the last remaining block flips to complete. Best-effort:
// any failure is logged and never blocks lesson completion.
const notifyParentOnCourseComplete = async (
  userId: string,
  lessonId: number
) => {
  try {
    const parentLink = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.childId, userId),
    });
    if (!parentLink) return; // not a child → nobody to notify

    // Resolve the course this lesson belongs to (lesson → unit → course).
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      columns: { unitId: true },
    });
    if (!lesson) return;
    const unit = await db.query.units.findFirst({
      where: eq(units.id, lesson.unitId),
      columns: { courseId: true },
    });
    if (!unit) return;
    const courseId = unit.courseId;

    // Collect every block in the course.
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      columns: { id: true },
    });
    const unitIds = courseUnits.map((u) => u.id);
    if (unitIds.length === 0) return;

    const courseLessons = await db.query.lessons.findMany({
      where: inArray(lessons.unitId, unitIds),
      columns: { id: true },
    });
    const lessonIds = courseLessons.map((l) => l.id);
    if (lessonIds.length === 0) return;

    const allBlocks = await db.query.lessonBlocks.findMany({
      where: inArray(lessonBlocks.lessonId, lessonIds),
      columns: { id: true },
    });
    if (allBlocks.length === 0) return;

    const completed = await db.query.lessonBlockProgress.findMany({
      where: and(
        eq(lessonBlockProgress.userId, userId),
        eq(lessonBlockProgress.completed, true)
      ),
      columns: { blockId: true },
    });
    const completedIds = new Set(completed.map((c) => c.blockId));

    const courseComplete = allBlocks.every((b) => completedIds.has(b.id));
    if (!courseComplete) return;

    const [child, course] = await Promise.all([
      db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        columns: { userName: true },
      }),
      db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        columns: { title: true },
      }),
    ]);

    await notifyUser(
      parentLink.parentId,
      "Course completed! 🎓",
      `${child?.userName || "Your child"} just finished ${
        course?.title || "a course"
      }!`,
      "/en/family/children"
    );
  } catch (error) {
    console.error("notifyParentOnCourseComplete failed", error);
  }
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

  // If that block completed the whole course, alert the child's parent.
  // Fire-and-forget (it self-handles errors) so it never blocks completion.
  void notifyParentOnCourseComplete(userId, lessonId);

  revalidatePath(`/learn`);
  revalidatePath(`/lesson`);
  revalidatePath(`/achievements`);
  revalidatePath(`/lesson/${lessonId}`);
};

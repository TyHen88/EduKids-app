"use server";

import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { courseAssignments, courses, familyGroups, familyGroupAdults, familyGroupChildren, userProgress } from "@/db/schema";
import { notifyUser } from "@/actions/notifications";

export const assignCourse = async (childId: string, courseId: number, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify parent-child relationship
  const ownedGroup = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  const adultLink = await db.query.familyGroupAdults.findFirst({
    where: eq(familyGroupAdults.userId, userId),
  });
  const familyGroupId = ownedGroup?.id || adultLink?.familyGroupId;

  const link = familyGroupId ? await db.query.familyGroupChildren.findFirst({
    where: and(
      eq(familyGroupChildren.familyGroupId, familyGroupId),
      eq(familyGroupChildren.childId, childId)
    ),
  }) : null;

  if (!link) throw new Error("Not authorized");

  // Check if already assigned
  const existing = await db.query.courseAssignments.findFirst({
    where: and(
      eq(courseAssignments.parentId, userId),
      eq(courseAssignments.childId, childId),
      eq(courseAssignments.courseId, courseId)
    ),
  });

  if (!existing) {
    await db.insert(courseAssignments).values({
      parentId: userId,
      childId: childId,
      courseId: courseId,
    });

    // Notify the child about the new assignment (in-app + web push). Only on a
    // genuinely new assignment, and fire-and-forget so it never blocks the UI.
    const [course, parent] = await Promise.all([
      db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        columns: { title: true },
      }),
      db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        columns: { userName: true },
      }),
    ]);
    void notifyUser(
      childId,
      "New course assigned! 📚",
      `${parent?.userName || "Your parent"} assigned you "${
        course?.title || "a new course"
      }". Time to learn!`,
      `/${lang}/learn`
    ).catch((e) => console.error("assignCourse notify failed", e));
  }

  // Also make it the active course for the child if they don't have one
  const childProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, childId),
  });

  if (childProgress && !childProgress.activeCourseId) {
    await db
      .update(userProgress)
      .set({ activeCourseId: courseId })
      .where(eq(userProgress.userId, childId));
  }

  revalidatePath(`/${lang}/family/courses`);
  revalidatePath(`/${lang}/family/children/${childId}`);
};

export const unassignCourse = async (childId: string, courseId: number, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify parent-child relationship
  const ownedGroup = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  const adultLink = await db.query.familyGroupAdults.findFirst({
    where: eq(familyGroupAdults.userId, userId),
  });
  const familyGroupId = ownedGroup?.id || adultLink?.familyGroupId;

  const link = familyGroupId ? await db.query.familyGroupChildren.findFirst({
    where: and(
      eq(familyGroupChildren.familyGroupId, familyGroupId),
      eq(familyGroupChildren.childId, childId)
    ),
  }) : null;

  if (!link) throw new Error("Not authorized");

  await db.delete(courseAssignments).where(
    and(
      eq(courseAssignments.parentId, userId),
      eq(courseAssignments.childId, childId),
      eq(courseAssignments.courseId, courseId)
    )
  );

  // If this was their active course, clear it
  const childProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, childId),
  });

  if (childProgress?.activeCourseId === courseId) {
    await db
      .update(userProgress)
      .set({ activeCourseId: null })
      .where(eq(userProgress.userId, childId));
  }

  revalidatePath(`/${lang}/family/courses`);
  revalidatePath(`/${lang}/family/children/${childId}`);
};

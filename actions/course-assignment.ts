"use server";

import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { courseAssignments, familyMembers, userProgress } from "@/db/schema";

export const assignCourse = async (childId: string, courseId: number, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify parent-child relationship
  const link = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.parentId, userId),
      eq(familyMembers.childId, childId)
    ),
  });

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
  const link = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.parentId, userId),
      eq(familyMembers.childId, childId)
    ),
  });

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

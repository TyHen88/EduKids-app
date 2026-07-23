"use server";

import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { familyGroups, familyGroupAdults, courses, userProgress } from "@/db/schema";
import { hasPermission } from "@/lib/family-permissions";
import type { CourseInput } from "@/actions/course";

// Guard: caller must be a parent account with course creation rights
const assertParentWithCoursePermission = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");
  
  const up = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { role: true },
  });
  if (up?.role !== "parent") throw new Error("Unauthorized.");

  // Owner check
  const ownedGroup = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  if (ownedGroup) return userId;

  // Adult member check
  const adultLink = await db.query.familyGroupAdults.findFirst({
    where: eq(familyGroupAdults.userId, userId),
  });
  if (adultLink && hasPermission(adultLink.permissions as any, "createCourse")) {
    return userId;
  }

  throw new Error("You do not have permission to create or manage courses.");
};

// Guard: caller must be creator OR course owner/authorized family member
export const assertCourseOwner = async (courseId: number) => {
  const userId = await assertParentWithCoursePermission();
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { createdBy: true },
  });
  if (!course) throw new Error("Course not found.");

  if (course.createdBy === userId) return userId;

  if (course.createdBy) {
    // If course created by another family member, check if caller is in the same family with createCourse permission
    const creatorOwnedGroup = await db.query.familyGroups.findFirst({
      where: eq(familyGroups.ownerId, course.createdBy),
    });
    const creatorAdultLink = await db.query.familyGroupAdults.findFirst({
      where: eq(familyGroupAdults.userId, course.createdBy),
    });
    const courseFamilyGroupId = creatorOwnedGroup?.id || creatorAdultLink?.familyGroupId;

  if (courseFamilyGroupId) {
    const callerOwnedGroup = await db.query.familyGroups.findFirst({
      where: eq(familyGroups.ownerId, userId),
    });
    const callerAdultLink = await db.query.familyGroupAdults.findFirst({
      where: eq(familyGroupAdults.userId, userId),
    });
    const callerFamilyGroupId = callerOwnedGroup?.id || callerAdultLink?.familyGroupId;

    if (callerFamilyGroupId === courseFamilyGroupId) {
      if (callerOwnedGroup || (callerAdultLink && hasPermission(callerAdultLink.permissions as any, "createCourse"))) {
        return userId;
      }
    }
  }
  }

  throw new Error("Unauthorized to modify this course.");
};

const normalize = (data: CourseInput) => ({
  title: data.title.trim(),
  imageSrc: data.imageSrc.trim() || "/edu-logo.png",
  description: data.description.trim(),
  category: data.category.trim() || "General",
  difficulty: data.difficulty.trim() || "Beginner",
});

export const createParentCourse = async (data: CourseInput, lang = "en") => {
  const userId = await assertParentWithCoursePermission();
  if (!data.title.trim()) throw new Error("Title is required.");

  await db.insert(courses).values({
    ...normalize(data),
    createdBy: userId,
  });

  revalidatePath(`/${lang}/family/my-courses`);
};

export const updateParentCourse = async (
  id: number,
  data: CourseInput,
  lang = "en"
) => {
  await assertCourseOwner(id);
  if (!data.title.trim()) throw new Error("Title is required.");

  await db
    .update(courses)
    .set(normalize(data))
    .where(eq(courses.id, id));

  revalidatePath(`/${lang}/family/my-courses`);
};

export const deleteParentCourse = async (id: number, lang = "en") => {
  await assertCourseOwner(id);

  await db.delete(courses).where(eq(courses.id, id));

  revalidatePath(`/${lang}/family/my-courses`);
  revalidatePath(`/${lang}/family/courses`);
};

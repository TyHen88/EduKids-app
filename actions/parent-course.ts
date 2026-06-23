"use server";

import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { courses, userProgress } from "@/db/schema";
import type { CourseInput } from "@/actions/course";

// Guard: caller must be a parent account
const assertParent = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");
  const up = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { role: true },
  });
  if (up?.role !== "parent") throw new Error("Unauthorized.");
  return userId;
};

// Guard: caller must be the parent who created this course
export const assertCourseOwner = async (courseId: number) => {
  const userId = await assertParent();
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { createdBy: true },
  });
  if (!course || course.createdBy !== userId) {
    throw new Error("Unauthorized.");
  }
  return userId;
};

const normalize = (data: CourseInput) => ({
  title: data.title.trim(),
  imageSrc: data.imageSrc.trim() || "/mascot.svg",
  description: data.description.trim(),
  category: data.category.trim() || "General",
  difficulty: data.difficulty.trim() || "Beginner",
});

export const createParentCourse = async (data: CourseInput, lang = "en") => {
  const userId = await assertParent();
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

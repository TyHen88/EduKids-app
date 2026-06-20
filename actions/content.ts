"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import db from "@/db/drizzle";
import {
  challengeOptions,
  challenges,
  courses,
  lessons,
  units,
  userProgress,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

// Guard: caller must be admin OR the parent who created this course
const assertEditorForCourse = async (courseId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");
  if (await getIsAdmin()) return; // admin always allowed

  // Check if parent owns this course
  const up = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { role: true },
  });
  if (up?.role !== "parent") throw new Error("Unauthorized.");

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { createdBy: true },
  });
  if (course?.createdBy !== userId) throw new Error("Unauthorized.");
};

const revalidate = (courseId: number, lang: string) => {
  revalidatePath(`/${lang}/admin/courses/${courseId}`);
  revalidatePath(`/${lang}/admin/courses`);
  revalidatePath(`/${lang}/family/my-courses/${courseId}`);
  revalidatePath(`/${lang}/family/my-courses`);
  revalidatePath(`/${lang}/learn`);
};

// --- Units -------------------------------------------------------------------

export type UnitInput = {
  title: string;
  description: string;
  order: number;
};

export const createUnit = async (
  courseId: number,
  data: UnitInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.title.trim()) throw new Error("Title is required.");
  await db.insert(units).values({
    courseId,
    title: data.title.trim(),
    description: data.description.trim(),
    order: data.order,
  });
  revalidate(courseId, lang);
};

export const updateUnit = async (
  id: number,
  courseId: number,
  data: UnitInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.title.trim()) throw new Error("Title is required.");
  await db
    .update(units)
    .set({
      title: data.title.trim(),
      description: data.description.trim(),
      order: data.order,
    })
    .where(eq(units.id, id));
  revalidate(courseId, lang);
};

export const deleteUnit = async (id: number, courseId: number, lang = "km") => {
  await assertEditorForCourse(courseId);
  await db.delete(units).where(eq(units.id, id));
  revalidate(courseId, lang);
};

// --- Lessons -----------------------------------------------------------------

export type LessonInput = {
  title: string;
  order: number;
};

export const createLesson = async (
  unitId: number,
  courseId: number,
  data: LessonInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.title.trim()) throw new Error("Title is required.");
  await db
    .insert(lessons)
    .values({ unitId, title: data.title.trim(), order: data.order });
  revalidate(courseId, lang);
};

export const updateLesson = async (
  id: number,
  courseId: number,
  data: LessonInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.title.trim()) throw new Error("Title is required.");
  await db
    .update(lessons)
    .set({ title: data.title.trim(), order: data.order })
    .where(eq(lessons.id, id));
  revalidate(courseId, lang);
};

export const deleteLesson = async (
  id: number,
  courseId: number,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  await db.delete(lessons).where(eq(lessons.id, id));
  revalidate(courseId, lang);
};

// --- Challenges --------------------------------------------------------------

export type ChallengeInput = {
  question: string;
  type: "SELECT" | "ASSIST";
  order: number;
};

export const createChallenge = async (
  lessonId: number,
  courseId: number,
  data: ChallengeInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.question.trim()) throw new Error("Question is required.");
  await db.insert(challenges).values({
    lessonId,
    question: data.question.trim(),
    type: data.type,
    order: data.order,
  });
  revalidate(courseId, lang);
};

export const updateChallenge = async (
  id: number,
  courseId: number,
  data: ChallengeInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.question.trim()) throw new Error("Question is required.");
  await db
    .update(challenges)
    .set({
      question: data.question.trim(),
      type: data.type,
      order: data.order,
    })
    .where(eq(challenges.id, id));
  revalidate(courseId, lang);
};

export const deleteChallenge = async (
  id: number,
  courseId: number,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  await db.delete(challenges).where(eq(challenges.id, id));
  revalidate(courseId, lang);
};

// --- Challenge options -------------------------------------------------------

export type OptionInput = {
  text: string;
  correct: boolean;
  imageSrc: string;
  audioSrc: string;
};

export const createOption = async (
  challengeId: number,
  courseId: number,
  data: OptionInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.text.trim()) throw new Error("Text is required.");
  await db.insert(challengeOptions).values({
    challengeId,
    text: data.text.trim(),
    correct: data.correct,
    imageSrc: data.imageSrc.trim() || null,
    audioSrc: data.audioSrc.trim() || null,
  });
  revalidate(courseId, lang);
};

export const updateOption = async (
  id: number,
  courseId: number,
  data: OptionInput,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  if (!data.text.trim()) throw new Error("Text is required.");
  await db
    .update(challengeOptions)
    .set({
      text: data.text.trim(),
      correct: data.correct,
      imageSrc: data.imageSrc.trim() || null,
      audioSrc: data.audioSrc.trim() || null,
    })
    .where(eq(challengeOptions.id, id));
  revalidate(courseId, lang);
};

export const deleteOption = async (
  id: number,
  courseId: number,
  lang = "km"
) => {
  await assertEditorForCourse(courseId);
  await db.delete(challengeOptions).where(eq(challengeOptions.id, id));
  revalidate(courseId, lang);
};

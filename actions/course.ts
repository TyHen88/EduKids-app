"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export type CourseInput = {
  title: string;
  imageSrc: string;
  description: string;
  category: string;
  difficulty: string;
};

const assertAdmin = async () => {
  if (!(await getIsAdmin())) throw new Error("Unauthorized.");
};

const normalize = (data: CourseInput): CourseInput => ({
  title: data.title.trim(),
  imageSrc: data.imageSrc.trim() || "/mascot.svg",
  description: data.description.trim(),
  category: data.category.trim() || "General",
  difficulty: data.difficulty.trim() || "Beginner",
});

export const createCourse = async (data: CourseInput, lang = "km") => {
  await assertAdmin();

  if (!data.title.trim()) throw new Error("Title is required.");

  await db.insert(courses).values(normalize(data));

  revalidatePath(`/${lang}/admin/courses`);
  revalidatePath(`/${lang}/admin`);
  revalidatePath(`/${lang}/courses`);
};

export const updateCourse = async (
  id: number,
  data: CourseInput,
  lang = "km"
) => {
  await assertAdmin();

  if (!data.title.trim()) throw new Error("Title is required.");

  await db.update(courses).set(normalize(data)).where(eq(courses.id, id));

  revalidatePath(`/${lang}/admin/courses`);
  revalidatePath(`/${lang}/admin`);
  revalidatePath(`/${lang}/courses`);
};

export const deleteCourse = async (id: number, lang = "km") => {
  await assertAdmin();

  await db.delete(courses).where(eq(courses.id, id));

  revalidatePath(`/${lang}/admin/courses`);
  revalidatePath(`/${lang}/admin`);
  revalidatePath(`/${lang}/courses`);
};

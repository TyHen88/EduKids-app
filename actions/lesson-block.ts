"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, inArray, notInArray, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import {
  lessonBlocks,
  lessonBlockOptions,
  courses,
  userProgress,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

// --- Guard -------------------------------------------------------------------

const assertEditorForCourse = async (courseId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");
  if (await getIsAdmin()) return userId;

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
  return userId;
};

const revalidate = (courseId: number, lang: string) => {
  revalidatePath(`/${lang}/admin/courses/${courseId}`);
  revalidatePath(`/${lang}/admin/courses`);
  revalidatePath(`/${lang}/family/my-courses/${courseId}`);
  revalidatePath(`/${lang}/family/my-courses`);
  revalidatePath(`/${lang}/learn`);
};

// --- Block Types --------------------------------------------------------------

export type BlockInput =
  | { type: "TEXT"; order: number; body: string }
  | { type: "IMAGE"; order: number; imageSrc: string; caption?: string }
  | {
      type: "SELECT" | "ASSIST";
      order: number;
      question: string;
      options?: {
        id?: number;
        text: string;
        correct: boolean;
        imageSrc?: string;
        audioSrc?: string;
      }[];
    };

export type BlockOptionInput = {
  text: string;
  correct: boolean;
  imageSrc?: string;
  audioSrc?: string;
};

// --- Block CRUD --------------------------------------------------------------

export const createLessonBlock = async (
  lessonId: number,
  courseId: number,
  data: BlockInput,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);

  const [insertedBlock] = await db
    .insert(lessonBlocks)
    .values({
      lessonId,
      type: data.type,
      order: data.order,
      body: data.type === "TEXT" ? data.body : null,
      imageSrc: data.type === "IMAGE" ? data.imageSrc : null,
      caption: data.type === "IMAGE" ? (data.caption ?? null) : null,
      question: (data.type === "SELECT" || data.type === "ASSIST") ? data.question : null,
    })
    .returning({ id: lessonBlocks.id });

  if ((data.type === "SELECT" || data.type === "ASSIST") && data.options && data.options.length > 0) {
    const optionValues = data.options.map((opt) => ({
      blockId: insertedBlock.id,
      text: opt.text.trim(),
      correct: opt.correct,
      imageSrc: opt.imageSrc?.trim() || null,
      audioSrc: opt.audioSrc?.trim() || null,
    }));
    await db.insert(lessonBlockOptions).values(optionValues);
  }

  revalidate(courseId, lang);
};

export const updateLessonBlock = async (
  id: number,
  courseId: number,
  data: BlockInput,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);

  await db
    .update(lessonBlocks)
    .set({
      type: data.type,
      order: data.order,
      body: data.type === "TEXT" ? data.body : null,
      imageSrc: data.type === "IMAGE" ? data.imageSrc : null,
      caption: data.type === "IMAGE" ? (data.caption ?? null) : null,
      question: (data.type === "SELECT" || data.type === "ASSIST") ? data.question : null,
    })
    .where(eq(lessonBlocks.id, id));

  if (data.type === "SELECT" || data.type === "ASSIST") {
    const options = data.options || [];

    // Find options to delete
    const updatedOptionIds = options.map((o) => o.id).filter(Boolean) as number[];
    if (updatedOptionIds.length > 0) {
      await db
        .delete(lessonBlockOptions)
        .where(
          and(
            eq(lessonBlockOptions.blockId, id),
            notInArray(lessonBlockOptions.id, updatedOptionIds)
          )
        );
    } else {
      await db
        .delete(lessonBlockOptions)
        .where(eq(lessonBlockOptions.blockId, id));
    }

    // Insert or update remaining options
    for (const opt of options) {
      if (opt.id) {
        await db
          .update(lessonBlockOptions)
          .set({
            text: opt.text.trim(),
            correct: opt.correct,
            imageSrc: opt.imageSrc?.trim() || null,
            audioSrc: opt.audioSrc?.trim() || null,
          })
          .where(eq(lessonBlockOptions.id, opt.id));
      } else {
        await db.insert(lessonBlockOptions).values({
          blockId: id,
          text: opt.text.trim(),
          correct: opt.correct,
          imageSrc: opt.imageSrc?.trim() || null,
          audioSrc: opt.audioSrc?.trim() || null,
        });
      }
    }
  }

  revalidate(courseId, lang);
};

export const deleteLessonBlock = async (
  id: number,
  courseId: number,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);

  await db.delete(lessonBlocks).where(eq(lessonBlocks.id, id));

  revalidate(courseId, lang);
};

// --- Block Option CRUD -------------------------------------------------------

export const createBlockOption = async (
  blockId: number,
  courseId: number,
  data: BlockOptionInput,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);
  if (!data.text.trim()) throw new Error("Text is required.");

  await db.insert(lessonBlockOptions).values({
    blockId,
    text: data.text.trim(),
    correct: data.correct,
    imageSrc: data.imageSrc?.trim() || null,
    audioSrc: data.audioSrc?.trim() || null,
  });

  revalidate(courseId, lang);
};

export const updateBlockOption = async (
  id: number,
  courseId: number,
  data: BlockOptionInput,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);
  if (!data.text.trim()) throw new Error("Text is required.");

  await db
    .update(lessonBlockOptions)
    .set({
      text: data.text.trim(),
      correct: data.correct,
      imageSrc: data.imageSrc?.trim() || null,
      audioSrc: data.audioSrc?.trim() || null,
    })
    .where(eq(lessonBlockOptions.id, id));

  revalidate(courseId, lang);
};

export const deleteBlockOption = async (
  id: number,
  courseId: number,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);

  await db.delete(lessonBlockOptions).where(eq(lessonBlockOptions.id, id));

  revalidate(courseId, lang);
};

export const reorderLessonBlocks = async (
  items: { id: number; order: number }[],
  courseId: number,
  lang = "en"
) => {
  await assertEditorForCourse(courseId);

  // Sequential updates to avoid neon-http driver transaction issues
  for (const item of items) {
    await db
      .update(lessonBlocks)
      .set({ order: item.order })
      .where(eq(lessonBlocks.id, item.id));
  }

  revalidate(courseId, lang);
};

export const uploadImage = async (formData: FormData) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded.");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fs = await import("fs/promises");
  const path = await import("path");

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".png";
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(uploadDir, filename);

  await fs.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
};


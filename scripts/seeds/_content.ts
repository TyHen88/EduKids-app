import { and, eq, isNull } from "drizzle-orm";

import * as schema from "@/db/schema";

import type { SeedDb } from "../seed";

// ---------------------------------------------------------------------------
// Shared plumbing for course-content seeds. Ignored by the runner (leading "_").
//
// A lesson is an ordered list of blocks:
//   TEXT           → a short teaching block (the worked example lives here,
//                    since the schema has no per-question explanation field)
//   SELECT/ASSIST  → a question with options; exactly one is `correct`
//
// `seedCourse` is ADDITIVE + IDEMPOTENT: it only ever touches the one course
// matching `title`, leaving every other course and all learner progress alone
// (unlike `db:prod`, which wipes the whole database). Re-running replaces that
// course's units, so content is safe to edit and re-run — but a re-run does
// reset progress *within that course*, because lesson_block_progress cascades
// off the blocks being replaced.
// ---------------------------------------------------------------------------

export type Option = { text: string; correct?: boolean };

export type Block =
  | { type: "TEXT"; body: string }
  | { type: "SELECT" | "ASSIST"; question: string; options: Option[] };

export type LessonSeed = { title: string; blocks: Block[] };
export type UnitSeed = { title: string; description: string; lessons: LessonSeed[] };

export type CourseContent = {
  title: string;
  imageSrc: string;
  category: string;
  difficulty: string;
  description: string;
  units: UnitSeed[];
};

export const text = (body: string): Block => ({ type: "TEXT", body });

export const select = (question: string, options: Option[]): Block => ({
  type: "SELECT",
  question,
  options,
});

export const assist = (question: string, options: Option[]): Block => ({
  type: "ASSIST",
  question,
  options,
});

export const seedCourse = async (db: SeedDb, course: CourseContent) => {
  // Every question must have exactly one correct option — a content typo here
  // would silently ship an unanswerable lesson, so fail before touching the DB.
  for (const u of course.units) {
    for (const l of u.lessons) {
      for (const b of l.blocks) {
        if (b.type === "TEXT") continue;
        const correct = b.options.filter((o) => o.correct).length;
        if (correct !== 1) {
          throw new Error(
            `"${l.title}" → "${b.question}" has ${correct} correct options (expected 1)`
          );
        }
      }
    }
  }

  const [existing] = await db
    .select()
    .from(schema.courses)
    .where(and(eq(schema.courses.title, course.title), isNull(schema.courses.createdBy)));

  let courseId: number;
  if (existing) {
    courseId = existing.id;
    // Replace this course's content only. Units cascade to lessons → blocks →
    // options. The course row itself stays, so user_progress.activeCourseId and
    // anyone's active-course selection keep pointing at it.
    await db.delete(schema.units).where(eq(schema.units.courseId, courseId));
    console.log(`  Course "${course.title}" (#${courseId}) exists — replacing its units.`);
  } else {
    const [created] = await db
      .insert(schema.courses)
      .values({
        title: course.title,
        imageSrc: course.imageSrc,
        category: course.category,
        difficulty: course.difficulty,
        description: course.description,
      })
      .returning();
    courseId = created.id;
    console.log(`  Created course "${course.title}" (#${courseId}).`);
  }

  let unitCount = 0;
  let lessonCount = 0;
  let blockCount = 0;
  let questionCount = 0;
  let optionCount = 0;

  let unitOrder = 1;
  for (const u of course.units) {
    const [unit] = await db
      .insert(schema.units)
      .values({ courseId, title: u.title, description: u.description, order: unitOrder++ })
      .returning();
    unitCount++;

    let lessonOrder = 1;
    for (const l of u.lessons) {
      const [lesson] = await db
        .insert(schema.lessons)
        .values({ unitId: unit.id, title: l.title, order: lessonOrder++ })
        .returning();
      lessonCount++;

      let blockOrder = 1;
      for (const b of l.blocks) {
        const isQuestion = b.type !== "TEXT";
        const [block] = await db
          .insert(schema.lessonBlocks)
          .values({
            lessonId: lesson.id,
            type: b.type,
            order: blockOrder++,
            body: b.type === "TEXT" ? b.body : null,
            question: isQuestion ? b.question : null,
          })
          .returning();
        blockCount++;

        if (isQuestion) {
          questionCount++;
          const rows = b.options.map((o) => ({
            blockId: block.id,
            text: o.text,
            correct: !!o.correct,
          }));
          await db.insert(schema.lessonBlockOptions).values(rows);
          optionCount += rows.length;
        }
      }
    }
  }

  console.log(
    `  ${unitCount} units, ${lessonCount} lessons, ${blockCount} blocks ` +
      `(${questionCount} questions, ${optionCount} options).`
  );
};

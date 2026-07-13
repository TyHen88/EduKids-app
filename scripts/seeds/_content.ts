import { and, eq, isNull } from "drizzle-orm";

import * as schema from "@/db/schema";

import type { SeedDb } from "../seed";

import { options, stats } from "./_options";

// ---------------------------------------------------------------------------
// Shared plumbing for content seeds — courses (`seedCourse`) and reading-library
// books (`seedBook`). Ignored by the runner (leading "_").
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
export type UnitSeed = {
  title: string;
  description: string;
  lessons: LessonSeed[];
};

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
            `"${l.title}" → "${b.question}" has ${correct} correct options (expected 1)`,
          );
        }
      }
    }
  }

  const [existing] = await db
    .select()
    .from(schema.courses)
    .where(
      and(
        eq(schema.courses.title, course.title),
        isNull(schema.courses.createdBy),
      ),
    );

  let courseId: number;
  if (existing) {
    if (!options.force) {
      // Additive by default: leave the existing course exactly as it is, so
      // `npm run seed all` only fills in what is missing.
      stats.skipped++;
      console.log(
        `  Course "${course.title}" (#${existing.id}) already exists — skipped.`,
      );
      return;
    }
    courseId = existing.id;
    // Replace this course's content only. Units cascade to lessons → blocks →
    // options. The course row itself stays, so user_progress.activeCourseId and
    // anyone's active-course selection keep pointing at it.
    await db.delete(schema.units).where(eq(schema.units.courseId, courseId));
    stats.replaced++;
    console.log(
      `  Course "${course.title}" (#${courseId}) exists — replacing its units.`,
    );
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
    stats.created++;
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
      .values({
        courseId,
        title: u.title,
        description: u.description,
        order: unitOrder++,
      })
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
      `(${questionCount} questions, ${optionCount} options).`,
  );
};

// --- Books (reading library) ------------------------------------------------
// A book is an ordered list of units (chapters), each a single rich-text HTML
// document. The reader renders it with dangerouslySetInnerHTML under
// `.book-prose`, which styles h1/h2, p, ul/ol, a, strong, s, img and table —
// stick to those tags, anything else lands unstyled.
//
// `bookUnits.order` is 0-based here to match `createBookUnit` in actions/book.ts
// (courses are 1-based — different tables, different existing convention).

export type BookUnitSeed = { title: string; content: string };

export type BookContent = {
  title: string;
  coverSrc: string;
  description: string;
  category: string;
  /** "km" | "en" — must match a locale the library filters on. */
  language: string;
  units: BookUnitSeed[];
};

export const seedBook = async (db: SeedDb, book: BookContent) => {
  if (book.units.length === 0)
    throw new Error(`Book "${book.title}" has no units.`);

  const [existing] = await db
    .select()
    .from(schema.books)
    .where(
      and(eq(schema.books.title, book.title), isNull(schema.books.createdBy)),
    );

  let bookId: number;
  if (existing) {
    if (!options.force) {
      // Additive by default — see seedCourse above.
      stats.skipped++;
      console.log(
        `  Book "${book.title}" (#${existing.id}) already exists — skipped.`,
      );
      return;
    }
    bookId = existing.id;
    // Replace this book's chapters only, so a re-run is safe to iterate on.
    // The book row survives, keeping its id (and any links to it) stable.
    await db
      .delete(schema.bookUnits)
      .where(eq(schema.bookUnits.bookId, bookId));
    stats.replaced++;
    console.log(
      `  Book "${book.title}" (#${bookId}) exists — replacing its units.`,
    );
  } else {
    const [created] = await db
      .insert(schema.books)
      .values({
        title: book.title,
        coverSrc: book.coverSrc,
        description: book.description,
        category: book.category,
        language: book.language,
        // Learners only see published books, and a seeded book is meant to be read.
        isPublished: true,
        createdBy: null, // null = system seed (not an admin's or parent's book)
      })
      .returning();
    bookId = created.id;
    stats.created++;
    console.log(`  Created book "${book.title}" (#${bookId}).`);
  }

  await db.insert(schema.bookUnits).values(
    book.units.map((u, i) => ({
      bookId,
      order: i,
      title: u.title,
      content: u.content,
    })),
  );

  console.log(`  ${book.units.length} chapters.`);
};

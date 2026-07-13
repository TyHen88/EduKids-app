import { and, eq, isNull } from "drizzle-orm";

import * as schema from "@/db/schema";

import type { SeedDb } from "../seed";

import { options, stats } from "./_options";

// ---------------------------------------------------------------------------
// Shared plumbing for storybook seeds. Ignored by the runner (leading "_").
//
// A book is a row in `books` plus ordered `bookUnits` (chapters / pages). Each
// unit's `content` is rich-text HTML — the same shape the Tiptap admin editor
// produces — and the Reader injects it with dangerouslySetInnerHTML into
// `.book-prose`. That class styles h1, h2, p, ul, ol, a, strong, s, img and
// table; anything else (blockquote, div…) renders unstyled, so stick to those.
//
// `seedBook` is ADDITIVE + IDEMPOTENT: it only touches the one book matching
// `title`, replacing its units. Every other book is left alone.
// ---------------------------------------------------------------------------

export type BookPage = { title: string; content: string };

export type BookContent = {
  title: string;
  coverSrc: string;
  description: string;
  category: string;
  language: string;
  pages: BookPage[];
};

export const seedBook = async (db: SeedDb, book: BookContent) => {
  const [existing] = await db
    .select()
    .from(schema.books)
    .where(and(eq(schema.books.title, book.title), isNull(schema.books.createdBy)));

  let bookId: number;
  if (existing) {
    if (!options.force) {
      // Additive by default, so `npm run seed all` only creates what is missing.
      stats.skipped++;
      console.log(`  Book "${book.title}" (#${existing.id}) already exists — skipped.`);
      return;
    }
    bookId = existing.id;
    // Replace this book's pages only; bookUnits cascade off the book row, which
    // stays put so any link to /read/<id> keeps working.
    await db.delete(schema.bookUnits).where(eq(schema.bookUnits.bookId, bookId));
    stats.replaced++;
    console.log(`  Book "${book.title}" (#${bookId}) exists — replacing its pages.`);
  } else {
    const [created] = await db
      .insert(schema.books)
      .values({
        title: book.title,
        coverSrc: book.coverSrc,
        description: book.description,
        category: book.category,
        language: book.language,
        // Books default to unpublished and are then invisible to learners —
        // a seeded book is meant to be read, so publish it.
        isPublished: true,
      })
      .returning();
    bookId = created.id;
    stats.created++;
    console.log(`  Created book "${book.title}" (#${bookId}).`);
  }

  await db.insert(schema.bookUnits).values(
    book.pages.map((page, i) => ({
      bookId,
      order: i + 1,
      title: page.title,
      content: page.content,
    }))
  );

  console.log(`  ${book.pages.length} pages → /read/${bookId}`);
};

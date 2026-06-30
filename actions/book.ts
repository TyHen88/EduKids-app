"use server";

import { eq, and, notInArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { books, bookPages } from "@/db/schema";

export type BookInput = {
  title: string;
  coverSrc: string;
  description: string;
  category: string;
  language: string;
  isPublished: boolean;
};

const assertAdmin = async () => {
  const { userId } = await auth();
  if (!userId || !(await getIsAdmin())) throw new Error("Unauthorized.");
  return userId;
};

const normalize = (data: BookInput) => ({
  title: data.title.trim(),
  coverSrc: data.coverSrc.trim() || "/edu-logo.png",
  description: data.description.trim(),
  category: data.category.trim() || "General",
  language: data.language.trim() || "en",
  isPublished: !!data.isPublished,
});

const revalidate = (lang: string, bookId?: number) => {
  revalidatePath(`/${lang}/admin/books`);
  if (bookId) revalidatePath(`/${lang}/admin/books/${bookId}`);
  revalidatePath(`/${lang}/books`);
  revalidatePath(`/${lang}/learn`);
};

// --- Book CRUD ---------------------------------------------------------------

export const createBook = async (data: BookInput, lang = "en") => {
  const userId = await assertAdmin();
  if (!data.title.trim()) throw new Error("Title is required.");

  const [row] = await db
    .insert(books)
    .values({ ...normalize(data), createdBy: userId })
    .returning({ id: books.id });

  revalidate(lang, row.id);
  return { id: row.id };
};

export const updateBook = async (id: number, data: BookInput, lang = "en") => {
  await assertAdmin();
  if (!data.title.trim()) throw new Error("Title is required.");

  await db.update(books).set(normalize(data)).where(eq(books.id, id));

  revalidate(lang, id);
};

export const deleteBook = async (id: number, lang = "en") => {
  await assertAdmin();

  // book_pages cascade on book delete (fk onDelete: cascade).
  await db.delete(books).where(eq(books.id, id));

  revalidate(lang);
};

// --- Page management ---------------------------------------------------------

// Append one or more page images (already uploaded to Blob) to the end of the
// book, preserving the given order.
export const addBookPages = async (
  bookId: number,
  imageSrcs: string[],
  lang = "en"
) => {
  await assertAdmin();
  const srcs = imageSrcs.map((s) => s.trim()).filter(Boolean);
  if (srcs.length === 0) return;

  const [{ value: currentMax } = { value: null }] = await db
    .select({ value: max(bookPages.order) })
    .from(bookPages)
    .where(eq(bookPages.bookId, bookId));

  let next = (currentMax ?? -1) + 1;
  const values = srcs.map((imageSrc) => ({
    bookId,
    imageSrc,
    order: next++,
  }));

  await db.insert(bookPages).values(values);

  revalidate(lang, bookId);
};

export const deleteBookPage = async (
  pageId: number,
  bookId: number,
  lang = "en"
) => {
  await assertAdmin();

  await db
    .delete(bookPages)
    .where(and(eq(bookPages.id, pageId), eq(bookPages.bookId, bookId)));

  revalidate(lang, bookId);
};

// Persist a new page order. `items` is the full ordered list of page ids.
export const reorderBookPages = async (
  bookId: number,
  orderedPageIds: number[],
  lang = "en"
) => {
  await assertAdmin();

  // Sequential updates (matches reorderLessonBlocks — avoids pooled-driver
  // transaction issues).
  for (let i = 0; i < orderedPageIds.length; i++) {
    await db
      .update(bookPages)
      .set({ order: i })
      .where(and(eq(bookPages.id, orderedPageIds[i]), eq(bookPages.bookId, bookId)));
  }

  revalidate(lang, bookId);
};

// Guard against stale ids: remove any pages not in the provided set (used when
// the editor saves a reconciled list). Optional helper, kept for completeness.
export const pruneBookPages = async (
  bookId: number,
  keepPageIds: number[],
  lang = "en"
) => {
  await assertAdmin();

  if (keepPageIds.length === 0) {
    await db.delete(bookPages).where(eq(bookPages.bookId, bookId));
  } else {
    await db
      .delete(bookPages)
      .where(
        and(eq(bookPages.bookId, bookId), notInArray(bookPages.id, keepPageIds))
      );
  }

  revalidate(lang, bookId);
};

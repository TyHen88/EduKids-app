"use server";

import { eq, and, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { books, bookUnits } from "@/db/schema";

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

  // book_units cascade on book delete (fk onDelete: cascade).
  await db.delete(books).where(eq(books.id, id));

  revalidate(lang);
};

// --- Unit (chapter) CRUD -----------------------------------------------------

export type BookUnitInput = {
  title: string;
  content: string; // rich-text HTML from the editor
};

const nextOrder = async (bookId: number) => {
  const [{ value } = { value: null }] = await db
    .select({ value: max(bookUnits.order) })
    .from(bookUnits)
    .where(eq(bookUnits.bookId, bookId));
  return (value ?? -1) + 1;
};

export const createBookUnit = async (
  bookId: number,
  data: BookUnitInput,
  lang = "en"
) => {
  await assertAdmin();
  const [row] = await db
    .insert(bookUnits)
    .values({
      bookId,
      order: await nextOrder(bookId),
      title: data.title.trim(),
      content: data.content ?? "",
    })
    .returning({ id: bookUnits.id });

  revalidate(lang, bookId);
  return { id: row.id };
};

export const updateBookUnit = async (
  unitId: number,
  bookId: number,
  data: BookUnitInput,
  lang = "en"
) => {
  await assertAdmin();
  await db
    .update(bookUnits)
    .set({ title: data.title.trim(), content: data.content ?? "" })
    .where(and(eq(bookUnits.id, unitId), eq(bookUnits.bookId, bookId)));

  revalidate(lang, bookId);
};

export const deleteBookUnit = async (
  unitId: number,
  bookId: number,
  lang = "en"
) => {
  await assertAdmin();
  await db
    .delete(bookUnits)
    .where(and(eq(bookUnits.id, unitId), eq(bookUnits.bookId, bookId)));

  revalidate(lang, bookId);
};

// Persist a new unit order from the full ordered list of unit ids.
export const reorderBookUnits = async (
  bookId: number,
  orderedUnitIds: number[],
  lang = "en"
) => {
  await assertAdmin();
  for (let i = 0; i < orderedUnitIds.length; i++) {
    await db
      .update(bookUnits)
      .set({ order: i })
      .where(
        and(eq(bookUnits.id, orderedUnitIds[i]), eq(bookUnits.bookId, bookId))
      );
  }

  revalidate(lang, bookId);
};

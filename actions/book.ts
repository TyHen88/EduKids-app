"use server";

import { eq, and, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { books, bookUnits, userProgress, familyGroups, familyGroupAdults } from "@/db/schema";
import { hasPermission } from "@/lib/family-permissions";

export type BookInput = {
  title: string;
  coverSrc: string;
  description: string;
  category: string;
  language: string;
  isPublished: boolean;
};

const assertAdminOrParent = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");
  const isAdmin = await getIsAdmin();
  if (isAdmin) return { userId, isAdmin, isParent: false };
  
  const user = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { role: true },
  });
  if (user?.role === "parent") {
    // Check family group ownership or book permission
    const ownedGroup = await db.query.familyGroups.findFirst({
      where: eq(familyGroups.ownerId, userId),
    });
    if (ownedGroup) return { userId, isAdmin: false, isParent: true };

    const adultLink = await db.query.familyGroupAdults.findFirst({
      where: eq(familyGroupAdults.userId, userId),
    });
    if (adultLink && hasPermission(adultLink.permissions as any, "book")) {
      return { userId, isAdmin: false, isParent: true };
    }
  }
  
  throw new Error("You do not have permission to manage storybooks.");
};

const assertBookOwnership = async (bookId: number) => {
  const { userId, isAdmin } = await assertAdminOrParent();
  if (isAdmin) return; // Admins can modify any book
  
  const book = await db.query.books.findFirst({
    where: eq(books.id, bookId),
    columns: { createdBy: true },
  });
  
  if (!book) throw new Error("Book not found.");
  if (book.createdBy === userId) return;

  // Check if caller is in the same family group as the creator with book permission
  if (book.createdBy) {
    const creatorOwnedGroup = await db.query.familyGroups.findFirst({
      where: eq(familyGroups.ownerId, book.createdBy),
    });
    const creatorAdultLink = await db.query.familyGroupAdults.findFirst({
      where: eq(familyGroupAdults.userId, book.createdBy),
    });
    const bookFamilyGroupId = creatorOwnedGroup?.id || creatorAdultLink?.familyGroupId;

    if (bookFamilyGroupId) {
      const callerOwnedGroup = await db.query.familyGroups.findFirst({
        where: eq(familyGroups.ownerId, userId),
      });
      const callerAdultLink = await db.query.familyGroupAdults.findFirst({
        where: eq(familyGroupAdults.userId, userId),
      });
      const callerFamilyGroupId = callerOwnedGroup?.id || callerAdultLink?.familyGroupId;

      if (callerFamilyGroupId === bookFamilyGroupId) {
        if (callerOwnedGroup || (callerAdultLink && hasPermission(callerAdultLink.permissions as any, "book"))) {
          return;
        }
      }
    }
  }

  throw new Error("Unauthorized to modify this book.");
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
  revalidatePath(`/${lang}/family/books`);
  if (bookId) {
    revalidatePath(`/${lang}/admin/books/${bookId}`);
    revalidatePath(`/${lang}/family/books/${bookId}`);
  }
  revalidatePath(`/${lang}/books`);
  revalidatePath(`/${lang}/learn`);
};

// --- Book CRUD ---------------------------------------------------------------

export const createBook = async (data: BookInput, lang = "en") => {
  const { userId, isAdmin } = await assertAdminOrParent();
  if (!data.title.trim()) throw new Error("Title is required.");

  const [row] = await db
    .insert(books)
    .values({ ...normalize(data), createdBy: isAdmin ? null : userId })
    .returning({ id: books.id });

  revalidate(lang, row.id);
  return { id: row.id };
};

export const updateBook = async (id: number, data: BookInput, lang = "en") => {
  await assertBookOwnership(id);
  if (!data.title.trim()) throw new Error("Title is required.");

  await db.update(books).set(normalize(data)).where(eq(books.id, id));

  revalidate(lang, id);
};

export const deleteBook = async (id: number, lang = "en") => {
  await assertBookOwnership(id);

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
  await assertBookOwnership(bookId);
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
  await assertBookOwnership(bookId);
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
  await assertBookOwnership(bookId);
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
  await assertBookOwnership(bookId);
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { getParentBook } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { BookUnitEditor } from "@/app/[lang]/admin/books/[bookId]/book-unit-editor";

type Props = {
  params: Promise<{ lang: string; bookId: string }>;
};

const ParentBookEditorPage = async ({ params }: Props) => {
  const { lang, bookId } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const id = Number(bookId);
  if (!Number.isFinite(id)) notFound();

  const book = await getParentBook(id);
  if (!book) notFound();

  return (
    <div className="flex h-full flex-col gap-5 pb-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/family/books`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-500 transition-colors hover:text-indigo-600"
          aria-label={dict["admin.backToBooks"] || "Back to books"}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {book.title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {dict["admin.bookEditorSubtitle"] ||
              "Organise your book into units and write each unit's content."}
          </p>
        </div>
        {book.isPublished ? (
          <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 sm:flex">
            <Eye className="h-3.5 w-3.5" />
            {dict["admin.published"] || "Published"}
          </span>
        ) : (
          <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 sm:flex">
            <EyeOff className="h-3.5 w-3.5" />
            {dict["admin.draft"] || "Draft"}
          </span>
        )}
      </div>

      <BookUnitEditor
        bookId={book.id}
        initialUnits={book.units.map((u) => ({
          id: u.id,
          title: u.title,
          content: u.content,
        }))}
        lang={lang}
      />
    </div>
  );
};

export default ParentBookEditorPage;

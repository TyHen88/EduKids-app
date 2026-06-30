import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAdminBook } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { BookPageManager } from "./book-page-manager";

type Props = {
  params: Promise<{ lang: string; bookId: string }>;
};

const AdminBookPagesPage = async ({ params }: Props) => {
  const { lang, bookId } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const id = Number(bookId);
  if (!Number.isFinite(id)) notFound();

  const book = await getAdminBook(id);
  if (!book) notFound();

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/admin/books`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-500 transition-colors hover:text-indigo-600"
          aria-label={dict["admin.backToBooks"] || "Back to books"}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {book.title}
          </h1>
          <p className="mt-1 text-base text-slate-500">
            {dict["admin.managePagesSubtitle"] ||
              "Upload, reorder and remove the book's pages."}
          </p>
        </div>
      </div>

      <BookPageManager
        bookId={book.id}
        initialPages={book.pages.map((p) => ({ id: p.id, imageSrc: p.imageSrc }))}
        lang={lang}
      />
    </div>
  );
};

export default AdminBookPagesPage;

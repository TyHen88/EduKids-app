import { BookOpen } from "lucide-react";

import { getPublishedBooks } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { BookCard } from "./book-card";

type Props = {
  params: Promise<{ lang: string }>;
};

// Learner book library — rendered inside the student shell.
const BooksPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const books = (await getPublishedBooks()).filter((b) => b.units > 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            {dict["books.title"] || "Story Books"}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {dict["books.subtitle"] || "Pick a book and start reading!"}
          </p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          {dict["books.empty"] || "No books yet. Check back soon!"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              lang={lang}
              unitsLabel={dict["books.units"] || "units"}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksPage;

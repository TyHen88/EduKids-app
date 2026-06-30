import Link from "next/link";
import Image from "next/image";
import { BookOpen, Images } from "lucide-react";

import { getPublishedBooks } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

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
            <Link
              key={book.id}
              href={`/${lang}/read/${book.id}`}
              className="group flex flex-col overflow-hidden rounded-3xl border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
                <Image
                  src={book.coverSrc}
                  alt={book.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {book.category}
                </div>
                <h3 className="line-clamp-2 text-sm font-black text-slate-800">
                  {book.title}
                </h3>
                <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-bold text-slate-400">
                  <Images className="h-3.5 w-3.5" /> {book.units}{" "}
                  {dict["books.units"] || "units"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksPage;

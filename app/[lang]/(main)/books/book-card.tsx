import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";

import type { LibraryBook } from "@/db/queries";

type BookCardProps = {
  book: LibraryBook;
  lang: string;
  unitsLabel: string;
};

// A single book tile linking into the reader. Shared by the Books page and the
// Backpack page's "Story Books" preview so both stay visually in sync.
export const BookCard = ({ book, lang, unitsLabel }: BookCardProps) => (
  <Link
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
        <Images className="h-3.5 w-3.5" /> {book.units} {unitsLabel}
      </div>
    </div>
  </Link>
);

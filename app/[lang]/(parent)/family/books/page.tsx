import { BookText } from "lucide-react";

import { getParentBooks } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { BookManager } from "@/app/[lang]/admin/books/book-manager";

type Props = {
  params: Promise<{ lang: string }>;
};

const ParentBooksPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const books = await getParentBooks();

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {dict["admin.books"] || "Books"}
          </h1>
          <p className="mt-1 text-base text-slate-500 sm:mt-2 sm:text-lg">
            {dict["admin.booksSubtitle"] || "Manage your family's storybooks."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 sm:flex">
          <BookText className="h-7 w-7" />
        </div>
      </div>

      <BookManager books={books} lang={lang} basePath={`/${lang}/family/books`} />
    </div>
  );
};

export default ParentBooksPage;

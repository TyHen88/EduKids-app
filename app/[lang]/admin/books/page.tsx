import { BookText, Library, FileText } from "lucide-react";

import { getAdminBooks } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { BookManager } from "./book-manager";

type Props = {
  params: Promise<{ lang: string }>;
};

const AdminBooksPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const books = await getAdminBooks();

  const totalCount = books.length;
  const publishedCount = books.filter((b) => b.isPublished).length;
  const draftCount = books.filter((b) => !b.isPublished).length;

  const cards = [
    {
      label: dict["admin.totalBooks"] || "Total Books",
      value: totalCount.toLocaleString(),
      icon: Library,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
    },
    {
      label: dict["admin.publishedBooks"] || "Published Books",
      value: publishedCount.toLocaleString(),
      icon: BookText,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: dict["admin.draftBooks"] || "Draft Books",
      value: draftCount.toLocaleString(),
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {dict["admin.books"] || "Books"}
          </h1>
          <p className="mt-1 text-base text-slate-500 sm:mt-2 sm:text-lg">
            {dict["admin.booksSubtitle"] ||
              "Create reading books and upload their pages for kids."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-100 bg-amber-50 text-amber-600 sm:flex">
          <BookText className="h-7 w-7" />
        </div>
      </div>

      {/* Book stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-3xl border-2 border-slate-100 bg-white p-5 shadow-sm sm:gap-4 sm:rounded-[32px] sm:p-8"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 sm:h-14 sm:w-14 ${stat.bg} ${stat.color}`}
            >
              <stat.icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-slate-800 sm:text-3xl">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BookManager books={books} lang={lang} basePath={`/${lang}/admin/books`} />
    </div>
  );
};

export default AdminBooksPage;

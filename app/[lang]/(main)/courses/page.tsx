import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

import { getCoursesWithProgress, getPublishedBooks } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { BookCard } from "../books/book-card";
import { BackpackCourses } from "./backpack-courses";

type Props = {
  params: Promise<{ lang: string }>;
};

const CoursesPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");

  const [courses, allBooks] = await Promise.all([
    getCoursesWithProgress(),
    getPublishedBooks(),
  ]);

  // Preview the 4 most recent readable books; the full library lives on /books.
  const previewBooks = allBooks.filter((b) => b.units > 0).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pb-12">
      {/* ── Books section (preview of 4 + "see all") ─────────────────── */}
      {previewBooks.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800">
                  {dict["books.title"] || "Story Books"}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {dict["books.subtitle"] || "Pick a book and start reading!"}
                </p>
              </div>
            </div>

            <Link
              href={`/${lang}/books`}
              className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              {dict["books.seeAll"] || "See all"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 px-2 sm:grid-cols-4 sm:gap-6">
            {previewBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                lang={lang}
                unitsLabel={dict["books.units"] || "units"}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Backpack section (courses, paginated 10 at a time) ────────── */}
      <section>
        <div className="mb-6 px-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {dict["courses.myBackpack"] || "My Backpack"} 🎒
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-500">
            {dict["courses.subtitle"] ||
              "Your collected learning books and adventures!"}
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="mx-2 rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
            {dict["courses.noneAvailable"] || "No courses available yet."}
          </div>
        ) : (
          <BackpackCourses courses={courses} lang={lang} pageSize={10} />
        )}
      </section>
    </div>
  );
};

export default CoursesPage;

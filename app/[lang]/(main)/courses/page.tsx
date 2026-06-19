import { getCoursesWithProgress } from "@/db/queries";

import { CourseCard } from "./course-card";

type Props = {
  params: Promise<{ lang: string }>;
};

const CoursesPage = async ({ params }: Props) => {
  const { lang } = await params;
  const courses = await getCoursesWithProgress();

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      <div className="mb-8 flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            My Backpack 🎒
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-500">
            Your collected learning books and adventures!
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          No courses available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 px-2 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;

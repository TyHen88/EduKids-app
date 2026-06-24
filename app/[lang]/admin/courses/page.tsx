import { BookOpen } from "lucide-react";

import { getAdminCourses } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { CourseManager } from "./course-manager";

type Props = {
  params: Promise<{ lang: string }>;
};

const AdminCoursesPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const courses = await getAdminCourses();

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {dict["admin.courses"] || "Courses"}
          </h1>
          <p className="mt-1 text-base text-slate-500 sm:mt-2 sm:text-lg">
            {dict["admin.coursesSubtitle"] ||
              "Create and manage your learning courses."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600 sm:flex">
          <BookOpen className="h-7 w-7" />
        </div>
      </div>

      <CourseManager courses={courses} lang={lang} />
    </div>
  );
};

export default AdminCoursesPage;

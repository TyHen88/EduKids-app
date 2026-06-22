import { BookOpen } from "lucide-react";

import { getParentCourses } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { ParentCourseManager } from "./parent-course-manager";

type Props = {
  params: Promise<{ lang: string }>;
};

const MyCoursesPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const courses = await getParentCourses();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {dict["myCourses.title"] || "My Courses"}
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            {dict["myCourses.subtitle"] ||
              "Create private courses exclusively for your children."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600 sm:flex">
          <BookOpen className="h-7 w-7" />
        </div>
      </div>

      <ParentCourseManager courses={courses} lang={lang} />
    </div>
  );
};

export default MyCoursesPage;

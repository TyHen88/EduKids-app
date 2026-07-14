import { BookOpen, GraduationCap, Globe, Lock } from "lucide-react";

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

  const totalCount = courses.length;
  const systemCount = courses.filter((c) => c.createdBy === null).length;
  const privateCount = courses.filter((c) => c.createdBy !== null).length;

  const cards = [
    {
      label: dict["admin.totalCourses"] || "Total Courses",
      value: totalCount.toLocaleString(),
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: dict["admin.systemCourses"] || "System Courses",
      value: systemCount.toLocaleString(),
      icon: Globe,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
    },
    {
      label: dict["admin.privateCourses"] || "Private Courses",
      value: privateCount.toLocaleString(),
      icon: Lock,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
    },
  ];

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

      {/* Course stats cards */}
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

      <CourseManager courses={courses} lang={lang} />
    </div>
  );
};

export default AdminCoursesPage;

import Image from "next/image";
import { Users, GraduationCap, PlayCircle, BookOpen } from "lucide-react";

import { getAdminStats, getCoursesWithProgress } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

const AdminDashboardPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const [stats, courses] = await Promise.all([
    getAdminStats(),
    getCoursesWithProgress(),
  ]);

  const cards = [
    {
      label: dict["admin.totalUsers"] || "Total Users",
      value: stats.students.toLocaleString(),
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
    },
    {
      label: dict["admin.totalCourses"] || "Total Courses",
      value: stats.courses.toLocaleString(),
      icon: GraduationCap,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
    },
    {
      label: dict["admin.totalLessons"] || "Total Lessons",
      value: stats.lessons.toLocaleString(),
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: dict["admin.completions"] || "Completions",
      value: stats.completions.toLocaleString(),
      icon: PlayCircle,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100",
    },
  ];

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
          {dict["admin.overviewTitle"] || "Admin Overview"}
        </h1>
        <p className="mt-1 text-base text-slate-500 sm:mt-2 sm:text-lg">
          {dict["admin.overviewSubtitle"] ||
            "A snapshot of your learning platform."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="text-2xl sm:text-3xl font-black text-slate-800">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Manage courses */}
        <div className="space-y-6 lg:col-span-2">
          <div className="relative overflow-hidden rounded-[32px] border-2 border-slate-100 bg-white p-5 sm:p-8 text-sm shadow-sm">
            <div className="absolute left-0 right-0 top-0 h-2 bg-indigo-500" />
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-800">
                {dict["admin.manageCourses"] || "Manage Courses"}
              </h2>
            </div>

            <div className="space-y-4">
              {courses.length === 0 && (
                <p className="text-slate-400">
                  {dict["admin.noCoursesYet"] || "No courses yet."}
                </p>
              )}
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group flex items-center justify-between rounded-2xl border-2 border-slate-100 p-4 transition-colors hover:border-indigo-100 hover:bg-indigo-50/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 sm:h-16 sm:w-16">
                      <Image
                        src={course.imageSrc}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-base font-bold text-slate-900">
                        {course.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-1">
                          {course.category}
                        </span>
                        <span>
                          {course.totalLessons} {dict["admin.lessons"] || "Lessons"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-indigo-600">
                    {course.difficulty}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick info */}
        <div>
          <div className="relative overflow-hidden rounded-[32px] border-2 border-slate-100 bg-white p-5 sm:p-8 shadow-sm">
            <div className="absolute left-0 right-0 top-0 h-2 bg-purple-500" />
            <h2 className="mb-4 sm:mb-6 text-lg font-bold tracking-tight text-slate-800">
              {dict["admin.platformHealth"] || "Platform Health"}
            </h2>
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                {stats.students} {dict["admin.learnersEnrolled"] || "learners enrolled"}
              </div>
              <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                {stats.lessons} {dict["admin.lessonsLower"] || "lessons"}{" "}
                {dict["admin.across"] || "across"} {stats.courses}{" "}
                {dict["admin.coursesLower"] || "courses"}
              </div>
              <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                {stats.completions} {dict["admin.blocksCompleted"] || "blocks completed"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

import { auth } from "@/lib/auth";
import { Users, UserCog, GraduationCap } from "lucide-react";

import { getAllStudents } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { StudentsTable } from "./students-table";

const AdminStudentsPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const [students, { userId: adminId }] = await Promise.all([
    getAllStudents(),
    auth(),
  ]);

  const parentCount = students.filter((s) => s.role === "parent").length;
  const learnerCount = students.filter((s) => s.role === "learner").length;

  const cards = [
    {
      label: dict["admin.totalParents"] || "Parent Accounts",
      value: parentCount.toLocaleString(),
      icon: UserCog,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
    },
    {
      label: dict["admin.totalLearners"] || "Learners",
      value: learnerCount.toLocaleString(),
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
  ];

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {dict["admin.users"] || "Users"}
          </h1>
          <p className="mt-1 text-base text-slate-500 sm:mt-2 sm:text-lg">
            {students.length}{" "}
            {students.length === 1
              ? dict["admin.userRegistered"] || "user registered."
              : dict["admin.usersRegistered"] || "users registered."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 sm:flex">
          <Users className="h-7 w-7" />
        </div>
      </div>

      {/* Account-type counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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

      <StudentsTable students={students} adminId={adminId} lang={lang} />
    </div>
  );
};

export default AdminStudentsPage;

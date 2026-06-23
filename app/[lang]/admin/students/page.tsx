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
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {dict["admin.users"] || "Users"}
          </h1>
          <p className="mt-2 text-lg text-slate-500">
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${stat.bg} ${stat.color}`}
            >
              <stat.icon className="h-7 w-7" />
            </div>
            <div>
              <div className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </div>
              <div className="text-3xl font-black text-slate-800">
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

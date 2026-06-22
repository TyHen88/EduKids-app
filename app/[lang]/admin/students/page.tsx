import { Users } from "lucide-react";

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
  const students = await getAllStudents();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {dict["admin.students"] || "Students"}
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            {students.length}{" "}
            {students.length === 1
              ? dict["admin.learnerEnrolled"] || "learner enrolled."
              : dict["admin.learnersEnrolledDot"] || "learners enrolled."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 sm:flex">
          <Users className="h-7 w-7" />
        </div>
      </div>

      <StudentsTable students={students} />
    </div>
  );
};

export default AdminStudentsPage;

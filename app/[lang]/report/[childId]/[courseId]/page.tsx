import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Rocket, ArrowLeft, CheckCircle2, Circle, XCircle } from "lucide-react";

import { getChildProgress, getChildCourses } from "@/db/queries";
import { PrintButton } from "./print-button";

type Props = {
  params: Promise<{ lang: string; childId: string; courseId: string }>;
};

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const gradeColor = (grade: string) =>
  grade === "A"
    ? "bg-emerald-500"
    : grade === "B"
      ? "bg-lime-500"
      : grade === "C"
        ? "bg-amber-500"
        : grade === "D"
          ? "bg-orange-500"
          : "bg-rose-500";

const ReportPage = async ({ params }: Props) => {
  const { lang, childId, courseId } = await params;

  const [child, courses] = await Promise.all([
    getChildProgress(childId),
    getChildCourses(childId),
  ]);
  const course = courses.find((c) => c.id === Number(courseId));

  if (!child || !course) {
    redirect(`/${lang}/family/children/${childId}`);
  }

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // All wrong questions across the course, tagged with their lesson.
  const reviewItems = course.units.flatMap((u) =>
    u.lessons.flatMap((l) =>
      l.wrongQuestions.map((q) => ({ ...q, lessonTitle: l.title }))
    )
  );

  return (
    <div
      className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:p-0"
      style={
        {
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties
      }
    >
      {/* Toolbar (screen only) */}
      <div className="mx-auto mb-4 flex max-w-[800px] items-center justify-between print:hidden">
        <Link
          href={`/${lang}/family/children/${childId}`}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <PrintButton />
      </div>

      {/* Paper */}
      <div className="mx-auto max-w-[800px] rounded-2xl bg-white p-10 shadow-sm print:rounded-none print:p-8 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 text-white">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-800">EduKids</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Course Progress Report
              </div>
            </div>
          </div>
          <div className="text-right text-xs font-medium text-slate-400">
            Generated
            <br />
            {generatedAt}
          </div>
        </div>

        {/* Student + course */}
        <div className="mt-6 flex items-center gap-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50">
            <Image src={child.userImageSrc} alt={child.userName} fill className="object-cover" sizes="64px" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {child.userName}
            </div>
            <h1 className="text-2xl font-black text-slate-800">{course.title}</h1>
            <div className="text-sm font-medium text-slate-500">{course.category}</div>
          </div>

          {/* Grade hero */}
          {course.score !== null && course.grade ? (
            <div
              className={
                "flex h-20 w-20 flex-col items-center justify-center rounded-2xl text-white " +
                gradeColor(course.grade)
              }
            >
              <div className="text-3xl font-black leading-none">{course.grade}</div>
              <div className="text-xs font-bold">{course.score}%</div>
            </div>
          ) : (
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
              <div className="text-xl font-black leading-none">—</div>
              <div className="text-[10px] font-bold">No score</div>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReportStat label="Progress" value={`${course.progress}%`} />
          <ReportStat label="Lessons" value={`${course.completedLessons}/${course.totalLessons}`} />
          <ReportStat label="Time spent" value={formatDuration(course.totalSeconds)} />
          <ReportStat label="Wrong answers" value={`${course.totalWrong}`} />
        </div>

        {/* Lessons by unit */}
        <h2 className="mb-3 mt-8 text-sm font-black uppercase tracking-widest text-slate-500">
          Lessons
        </h2>
        <div className="space-y-4">
          {course.units.map((unit) => (
            <div key={unit.id}>
              <div className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                {unit.title}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {unit.lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <span className="inline-flex items-center gap-2">
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300" />
                          )}
                          <span className={lesson.completed ? "font-bold text-slate-700" : "text-slate-400"}>
                            {lesson.title}
                          </span>
                        </span>
                      </td>
                      <td className="w-24 py-2 text-right font-medium text-slate-500">
                        {lesson.seconds > 0 ? formatDuration(lesson.seconds) : "—"}
                      </td>
                      <td className="w-20 py-2 text-right font-bold text-rose-500">
                        {lesson.wrongAnswers > 0 ? `${lesson.wrongAnswers} wrong` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Questions to review */}
        <h2 className="mb-3 mt-8 text-sm font-black uppercase tracking-widest text-slate-500">
          Questions to Review
        </h2>
        {reviewItems.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            No mistakes recorded — great job! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {reviewItems.map((q, i) => (
              <div
                key={`${q.blockId}-${i}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-slate-700">{q.question}</div>
                  <span className="flex shrink-0 items-center gap-1 font-bold text-rose-500">
                    <XCircle className="h-3.5 w-3.5" /> {q.count}×
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {q.lessonTitle}
                </div>
                {(q.correctAnswer || q.chosenAnswers.length > 0) && (
                  <div className="mt-1 font-medium">
                    {q.correctAnswer && (
                      <span className="text-emerald-600">Correct: {q.correctAnswer}</span>
                    )}
                    {q.chosenAnswers.length > 0 && (
                      <span className="text-rose-500">
                        {q.correctAnswer ? ", " : ""}Wrong: {q.chosenAnswers.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 border-t-2 border-slate-100 pt-4 text-center text-[11px] font-medium text-slate-400">
          EduKids · {child.userName} · {course.title} · {generatedAt}
        </div>
      </div>
    </div>
  );
};

const ReportStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
    <div className="text-lg font-black text-slate-800">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
  </div>
);

export default ReportPage;

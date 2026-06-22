import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  Heart,
  Star,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  AlertTriangle,
  XCircle,
  FileDown,
} from "lucide-react";

import { getChildProgress, getChildCourses } from "@/db/queries";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "./refresh-button";

const gradeBadgeClass = (grade: string) =>
  grade === "A"
    ? "bg-emerald-100 text-emerald-700"
    : grade === "B"
      ? "bg-lime-100 text-lime-700"
      : grade === "C"
        ? "bg-amber-100 text-amber-700"
        : grade === "D"
          ? "bg-orange-100 text-orange-700"
          : "bg-rose-100 text-rose-700";

type Props = {
  params: Promise<{ lang: string; childId: string }>;
};

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const ChildDetailPage = async ({ params }: Props) => {
  const { lang, childId } = await params;
  const [child, childCourses] = await Promise.all([
    getChildProgress(childId),
    getChildCourses(childId),
  ]);

  if (!child) {
    redirect(`/${lang}/family/children`);
  }

  const totalSeconds = childCourses.reduce((sum, c) => sum + c.totalSeconds, 0);

  const now = Date.now();
  const STALE_MS = 7 * 24 * 60 * 60 * 1000;
  const relativeDays = (d: Date | null) => {
    if (!d) return "Not started";
    const days = Math.floor((now - new Date(d).getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "Active today";
    if (days === 1) return "Active yesterday";
    return `Active ${days} days ago`;
  };
  const needsAttention = (c: (typeof childCourses)[number]) =>
    c.totalLessons > 0 &&
    c.progress < 100 &&
    (c.lastActiveAt === null || now - new Date(c.lastActiveAt).getTime() >= STALE_MS);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full">
          <Link href={`/${lang}/family/children`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {child.userName}&apos;s Progress
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Profile overview */}
        <div className="flex shrink-0 flex-col items-center gap-4 rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm md:w-64">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50">
            <Image
              src={child.userImageSrc}
              alt={child.userName}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800">{child.userName}</h2>
            <p className="text-sm font-medium text-slate-500">Learner</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={<Star className="h-7 w-7 text-indigo-500" />} value={child.points} label="XP" />
          <Stat icon={<Flame className="h-7 w-7 text-orange-500" />} value={child.streak} label="Day Streak" />
          <Stat icon={<Heart className="h-7 w-7 text-rose-500" />} value={child.hearts} label="Hearts" />
          <Stat
            icon={<Clock className="h-7 w-7 text-emerald-500" />}
            value={formatDuration(totalSeconds)}
            label="Time Learning"
          />
        </div>
      </div>

      {/* Courses with progress + time */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-500" />
            <h3 className="text-lg font-black text-slate-800">Courses</h3>
            {childCourses.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-black text-emerald-700">
                {childCourses.length}
              </span>
            )}
          </div>
          <RefreshButton />
        </div>

        {childCourses.length === 0 ? (
          <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No courses assigned yet.{" "}
            <Link
              href={`/${lang}/family/courses`}
              className="font-bold text-emerald-600 hover:underline"
            >
              Assign a course
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {childCourses.map((course) => (
              <details
                key={course.id}
                className="group overflow-hidden rounded-[28px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-50 bg-slate-50">
                    <Image
                      src={course.imageSrc}
                      alt={course.title}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <h4 className="truncate font-black text-slate-800">{course.title}</h4>
                        {course.score !== null && course.grade && (
                          <span
                            className={
                              "flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider " +
                              gradeBadgeClass(course.grade)
                            }
                          >
                            {course.grade} · {course.score}%
                          </span>
                        )}
                        {needsAttention(course) && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> Attention
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </div>

                    {/* progress bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-600">{course.progress}%</span>
                    </div>

                    {/* meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        {formatDuration(course.totalSeconds)} total
                      </span>
                      {course.avgSeconds > 0 && (
                        <span>~{formatDuration(course.avgSeconds)}/lesson</span>
                      )}
                      <span
                        className={
                          "flex items-center gap-1 " +
                          (course.totalWrong > 0 ? "text-rose-500" : "")
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {course.totalWrong} wrong
                      </span>
                      <span>{relativeDays(course.lastActiveAt)}</span>
                    </div>
                  </div>
                </summary>

                {/* Per-unit, per-lesson detail */}
                <div className="space-y-4 border-t-2 border-slate-100 px-5 py-4">
                  <div className="flex justify-end">
                    <Link
                      href={`/${lang}/report/${childId}/${course.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Export PDF
                    </Link>
                  </div>

                  {course.totalLessons === 0 ? (
                    <p className="text-center text-sm font-medium text-slate-400">
                      This course has no lessons yet.
                    </p>
                  ) : (
                    course.units.map((unit) => (
                      <div key={unit.id}>
                        <div className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {unit.title}
                        </div>
                        <ul className="space-y-1.5">
                          {unit.lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="rounded-xl bg-slate-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                                )}
                                <span
                                  className={
                                    "flex-1 truncate text-sm font-bold " +
                                    (lesson.completed ? "text-slate-700" : "text-slate-400")
                                  }
                                >
                                  {lesson.title}
                                </span>
                                {lesson.wrongAnswers > 0 && (
                                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-rose-500">
                                    <XCircle className="h-3 w-3" />
                                    {lesson.wrongAnswers}
                                  </span>
                                )}
                                <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  {lesson.seconds > 0 ? formatDuration(lesson.seconds) : "—"}
                                </span>
                              </div>

                              {/* Which questions were wrong, with answers */}
                              {lesson.wrongQuestions.length > 0 && (
                                <ul className="mt-2 space-y-2 border-l-2 border-rose-100 pl-3">
                                  {lesson.wrongQuestions.map((q) => (
                                    <li key={q.blockId} className="text-xs">
                                      <div className="flex items-start justify-between gap-3">
                                        <span className="font-bold text-slate-600">
                                          {q.question}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1 font-bold text-rose-500">
                                          <XCircle className="h-3 w-3" />
                                          {q.count}×
                                        </span>
                                      </div>
                                      {(q.correctAnswer || q.chosenAnswers.length > 0) && (
                                        <div className="mt-0.5 font-medium">
                                          {q.correctAnswer && (
                                            <span className="text-emerald-600">
                                              Correct: {q.correctAnswer}
                                            </span>
                                          )}
                                          {q.chosenAnswers.length > 0 && (
                                            <span className="text-rose-500">
                                              {q.correctAnswer ? ", " : ""}Wrong:{" "}
                                              {q.chosenAnswers.join(", ")}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-[28px] border-2 border-slate-100 bg-white p-6 shadow-sm">
    {icon}
    <div className="text-center">
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  </div>
);

export default ChildDetailPage;

"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlayCircle, CheckCircle2, Check } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { upsertUserProgress } from "@/actions/user-progress";
import type { CourseWithProgress } from "@/db/queries";

type CourseCardProps = {
  course: CourseWithProgress;
  lang: string;
};

export const CourseCard = ({ course, lang }: CourseCardProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSelect = () => {
    if (course.isActive) {
      router.push(`/${lang}/path`);
      return;
    }

    startTransition(() => {
      upsertUserProgress(course.id, lang).catch(() =>
        toast.error("Something went wrong.")
      );
    });
  };

  return (
    <div className="group flex flex-col rounded-[32px] border-2 border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="relative mb-6 h-48 overflow-hidden rounded-2xl border-2 border-slate-50">
        <Image
          src={course.imageSrc}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm backdrop-blur-md">
          {course.category}
        </div>
        {course.isActive && (
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
            <Check className="h-3 w-3" /> Active
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>{course.difficulty}</span>
            <span>·</span>
            <span>{course.totalLessons} Lessons</span>
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-800">
            {course.title}
          </h3>
          <p className="mb-6 line-clamp-2 text-sm text-slate-500">
            {course.description || "Start your learning adventure!"}
          </p>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs font-bold">
            <span className="uppercase tracking-wider text-slate-400">
              Progress
            </span>
            <span className="font-black text-indigo-600">
              {course.progress}%
            </span>
          </div>
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>

          <button
            onClick={onSelect}
            disabled={pending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold shadow-sm transition-colors disabled:opacity-60",
              course.status === "In Progress"
                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : course.status === "Completed"
                  ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "border-b-4 border-indigo-800 bg-indigo-600 text-white hover:bg-indigo-700 active:mt-1 active:border-b-0"
            )}
          >
            {course.status === "Completed" ? (
              <>
                <CheckCircle2 className="h-5 w-5" /> Read Again
              </>
            ) : course.isActive ? (
              <>
                <PlayCircle className="h-5 w-5" /> Continue Book
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5" /> Start Book
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

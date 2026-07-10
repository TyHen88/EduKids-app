"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlayCircle, CheckCircle2, Check, Info } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { upsertUserProgress } from "@/actions/user-progress";
import type { CourseWithProgress } from "@/db/queries";
import { useDictionary } from "@/app/[lang]/lang-provider";

type CourseCardProps = {
  course: CourseWithProgress;
  lang: string;
};

export const CourseCard = ({ course, lang }: CourseCardProps) => {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showEmptyInfo, setShowEmptyInfo] = useState(false);

  const onSelect = () => {
    // Don't let the user open a book that has no lessons yet.
    if (course.totalLessons === 0) {
      setShowEmptyInfo(true);
      return;
    }

    if (course.isActive) {
      router.push(`/${lang}/path`);
      return;
    }

    startTransition(async () => {
      try {
        await upsertUserProgress(course.id, lang);
        router.push(`/${lang}/learn`);
      } catch {
        toast.error(
          dict["common.somethingWentWrong"] || "Something went wrong."
        );
      }
    });
  };

  return (
    <div className="group flex flex-col rounded-3xl border-2 border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:rounded-[32px] sm:p-6">
      <div className="relative mb-4 h-28 overflow-hidden rounded-2xl border-2 border-slate-50 bg-slate-50 sm:mb-6 sm:h-48">
        <Image
          src={course.imageSrc}
          alt={course.title}
          fill
          className="object-contain transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 400px"
        />
        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700 shadow-sm backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs">
          {course.category}
        </div>
        {course.isActive && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs">
            <Check className="h-3 w-3" /> {dict["courses.active"] || "Active"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
            <span>{course.difficulty}</span>
            <span>·</span>
            <span>
              {course.totalLessons} {dict["courses.lessons"] || "Lessons"}
            </span>
          </div>
          <h3 className="mb-1.5 line-clamp-2 text-base font-bold text-slate-800 sm:mb-2 sm:text-xl">
            {course.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-xs text-slate-500 sm:mb-6 sm:text-sm">
            {course.description ||
              dict["courses.startAdventure"] ||
              "Start your learning adventure!"}
          </p>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-[11px] font-bold sm:text-xs">
            <span className="uppercase tracking-wider text-slate-400">
              {dict["courses.progress"] || "Progress"}
            </span>
            <span className="font-black text-indigo-600">
              {course.progress}%
            </span>
          </div>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 sm:mb-6">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>

          <button
            onClick={onSelect}
            disabled={pending}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold shadow-sm transition-colors disabled:opacity-60 sm:gap-2 sm:py-3.5 sm:text-base",
              course.status === "In Progress"
                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : course.status === "Completed"
                  ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "border-b-4 border-indigo-800 bg-indigo-600 text-white hover:bg-indigo-700 active:mt-1 active:border-b-0"
            )}
          >
            {course.status === "Completed" ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="truncate">
                  {dict["courses.readAgain"] || "Read Again"}
                </span>
              </>
            ) : course.isActive ? (
              <>
                <PlayCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="truncate">
                  {dict["courses.continueBook"] || "Continue Book"}
                </span>
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="truncate">
                  {dict["courses.startBook"] || "Start Book"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <Dialog open={showEmptyInfo} onOpenChange={setShowEmptyInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Info className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              {dict["courses.noLessonsYet"] || "No lessons yet"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm font-medium text-slate-500">
            <span className="font-bold text-slate-700">{course.title}</span>
          </p>
          <DialogFooter>
            <Button
              className="w-full rounded-xl border-b-4 border-indigo-800 bg-indigo-600 font-bold text-white hover:bg-indigo-700 active:translate-y-1 active:border-b-0"
              onClick={() => setShowEmptyInfo(false)}
            >
              {dict["common.gotIt"] || "Got it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

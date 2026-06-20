"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { assignCourse, unassignCourse } from "@/actions/course-assignment";
import { cn } from "@/lib/utils";

type CoursesClientProps = {
  courses: any[];
  childrenData: any[];
  assignments: any[];
  lang: string;
};

export const CoursesClient = ({ courses, childrenData, assignments, lang }: CoursesClientProps) => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    childrenData.length > 0 ? childrenData[0].userId : null
  );
  const [isPending, startTransition] = useTransition();
  const [loadingCourseId, setLoadingCourseId] = useState<number | null>(null);

  if (childrenData.length === 0) {
    return (
      <div className="space-y-8 pb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Assign Courses</h1>
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          Add children to your family first to assign courses to them.
        </div>
      </div>
    );
  }

  const handleToggleAssignment = (courseId: number, isAssigned: boolean) => {
    if (!selectedChildId) return;

    setLoadingCourseId(courseId);
    startTransition(async () => {
      try {
        if (isAssigned) {
          await unassignCourse(selectedChildId, courseId, lang);
          toast.success("Course unassigned");
        } else {
          await assignCourse(selectedChildId, courseId, lang);
          toast.success("Course assigned");
        }
      } catch (err: any) {
        toast.error(err.message || "Something went wrong");
      } finally {
        setLoadingCourseId(null);
      }
    });
  };

  const selectedChildAssignments = assignments
    .filter((a) => a.childId === selectedChildId)
    .map((a) => a.courseId);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Assign Courses
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Choose which courses your children can play.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {childrenData.map((child) => (
          <button
            key={child.userId}
            onClick={() => setSelectedChildId(child.userId)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 p-3 transition-all",
              selectedChildId === child.userId
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-slate-100 bg-white hover:border-emerald-200"
            )}
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50">
              <Image src={child.userImageSrc} alt={child.userName} fill className="object-cover" />
            </div>
            <div className="text-left">
              <div className={cn("text-sm font-bold", selectedChildId === child.userId ? "text-emerald-700" : "text-slate-700")}>
                {child.userName}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const isAssigned = selectedChildAssignments.includes(course.id);

          return (
            <div
              key={course.id}
              className={cn(
                "flex flex-col justify-between rounded-[32px] border-2 p-6 transition-all",
                isAssigned ? "border-emerald-200 bg-white shadow-sm" : "border-slate-100 bg-white/50"
              )}
            >
              <div>
                <div className="relative mb-4 h-32 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <Image src={course.imageSrc} alt={course.title} fill className="object-cover" />
                </div>
                <h3 className="mb-2 text-xl font-black text-slate-800">{course.title}</h3>
                <p className="text-sm font-medium text-slate-500 line-clamp-2">{course.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    {course.category}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 uppercase">
                    {course.difficulty}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-100">
                <Button
                  disabled={isPending}
                  onClick={() => handleToggleAssignment(course.id, isAssigned)}
                  variant={isAssigned ? "secondary" : "default"}
                  className={cn(
                    "w-full h-12 rounded-xl text-base font-bold",
                    isAssigned ? "text-slate-600 bg-slate-100 hover:bg-slate-200" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
                  )}
                >
                  {isPending && loadingCourseId === course.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isAssigned ? (
                    <>
                      <Check className="mr-2 h-5 w-5 text-emerald-500" /> Assigned
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" /> Assign to {childrenData.find(c => c.userId === selectedChildId)?.userName}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

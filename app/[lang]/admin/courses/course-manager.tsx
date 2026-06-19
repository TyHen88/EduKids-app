"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  Layers,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  type CourseInput,
} from "@/actions/course";
import type { AdminCourse } from "@/db/queries";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const empty: CourseInput = {
  title: "",
  imageSrc: "/mascot.svg",
  description: "",
  category: "General",
  difficulty: "Beginner",
};

export const CourseManager = ({
  courses,
  lang,
}: {
  courses: AdminCourse[];
  lang: string;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseInput>(empty);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (course: AdminCourse) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      imageSrc: course.imageSrc,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
    });
    setOpen(true);
  };

  const set = (key: keyof CourseInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    startTransition(() => {
      const action = editingId
        ? updateCourse(editingId, form, lang)
        : createCourse(form, lang);

      action
        .then(() => {
          toast.success(editingId ? "Course updated." : "Course created.");
          setOpen(false);
          router.refresh();
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  const onDelete = (course: AdminCourse) => {
    if (
      !window.confirm(
        `Delete "${course.title}"? This removes its units, lessons and all progress.`
      )
    )
      return;

    startTransition(() => {
      deleteCourse(course.id, lang)
        .then(() => {
          toast.success("Course deleted.");
          router.refresh();
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={openCreate} disabled={pending}>
          <Plus className="mr-1 h-5 w-5" /> Create Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          No courses yet. Create your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex gap-4 rounded-[24px] border-2 border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-100"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-100">
                <Image
                  src={course.imageSrc}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800">{course.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">
                        {course.category}
                      </span>
                      <span>{course.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(course)}
                      disabled={pending}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(course)}
                      disabled={pending}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> {course.units}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> {course.lessons}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {course.students}
                    </span>
                  </div>
                  <Link
                    href={`/${lang}/admin/courses/${course.id}`}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Content
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Edit course" : "Create course"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Science Explorer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Science"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imageSrc">Image path or URL</Label>
              <Input
                id="imageSrc"
                value={form.imageSrc}
                onChange={(e) => set("imageSrc", e.target.value)}
                placeholder="/math.svg"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("difficulty", d)}
                    className={
                      "flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold transition-colors " +
                      (form.difficulty === d
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50")
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What will kids learn?"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="primaryOutline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={onSubmit} disabled={pending}>
              {editingId ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

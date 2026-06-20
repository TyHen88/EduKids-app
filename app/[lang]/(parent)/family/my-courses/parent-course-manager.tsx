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
  Layers,
  Settings2,
  Lock,
  Upload,
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
  createParentCourse,
  updateParentCourse,
  deleteParentCourse,
} from "@/actions/parent-course";
import { uploadImage } from "@/actions/lesson-block";
import type { CourseInput } from "@/actions/course";
import type { ParentCourse } from "@/db/queries";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const empty: CourseInput = {
  title: "",
  imageSrc: "/mascot.svg",
  description: "",
  category: "General",
  difficulty: "Beginner",
};

export const ParentCourseManager = ({
  courses,
  lang,
}: {
  courses: ParentCourse[];
  lang: string;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseInput>(empty);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (course: ParentCourse) => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading("Uploading course image...");
    try {
      const url = await uploadImage(formData);
      set("imageSrc", url);
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.", { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    startTransition(() => {
      const action = editingId
        ? updateParentCourse(editingId, form, lang)
        : createParentCourse(form, lang);

      action
        .then(() => {
          toast.success(editingId ? "Course updated." : "Course created.");
          setOpen(false);
          router.refresh();
        })
        .catch((e: any) => toast.error(e?.message || "Something went wrong."));
    });
  };

  const onDelete = (course: ParentCourse) => {
    if (
      !window.confirm(
        `Delete "${course.title}"? This removes all its content.`
      )
    )
      return;

    startTransition(() => {
      deleteParentCourse(course.id, lang)
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
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 rounded-2xl font-bold"
          onClick={openCreate}
          disabled={pending}
        >
          <Plus className="mr-1 h-5 w-5" /> Create Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="mb-1 text-lg font-bold text-slate-700">No courses yet</h3>
          <p className="text-sm font-medium text-slate-400">
            Create a private course exclusively for your children.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex gap-4 rounded-[24px] border-2 border-b-4 border-emerald-100 border-b-emerald-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-200"
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{course.title}</h3>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        <Lock className="h-2.5 w-2.5" /> Private
                      </span>
                    </div>
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
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
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
                  </div>
                  <Link
                    href={`/${lang}/family/my-courses/${course.id}`}
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
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
              {editingId ? "Edit course" : "Create private course"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. My Math Course"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Math"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imageSrc">Image upload or URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imageSrc"
                  value={form.imageSrc}
                  onChange={(e) => set("imageSrc", e.target.value)}
                  placeholder="/math.svg"
                  className="flex-1"
                />
                <label className="cursor-pointer bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-xs font-bold shrink-0 hover:bg-emerald-100 transition flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
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
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
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
                placeholder="What will your children learn?"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="primaryOutline"
              onClick={() => setOpen(false)}
              disabled={pending || uploading}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              onClick={onSubmit}
              disabled={pending || uploading}
            >
              {editingId ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

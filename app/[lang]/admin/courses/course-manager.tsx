"use client";

import { useEffect, useState, useTransition } from "react";
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
  Upload,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AiInput } from "@/components/ui/ai-input";
import { AiTextarea } from "@/components/ui/ai-textarea";
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
import { uploadImage } from "@/actions/lesson-block";
import { Pagination } from "@/components/ui/pagination";
import type { AdminCourse } from "@/db/queries";
import { useDictionary } from "@/app/[lang]/lang-provider";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const PAGE_SIZE = 6;

const empty: CourseInput = {
  title: "",
  imageSrc: "/edu-logo.png",
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
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseInput>(empty);
  const [uploading, setUploading] = useState(false);

  const [sourceFilter, setSourceFilter] = useState<"ALL" | "SYSTEM" | "MY_COURSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  const categories = Array.from(new Set(courses.map((c) => c.category))).filter(Boolean);

  const filteredCourses = courses.filter((course) => {
    if (sourceFilter === "SYSTEM" && course.createdBy !== null) return false;
    if (sourceFilter === "MY_COURSE" && course.createdBy === null) return false;
    if (categoryFilter !== "ALL" && course.category !== categoryFilter) return false;
    if (difficultyFilter !== "ALL" && course.difficulty !== difficultyFilter) return false;
    return true;
  });

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));

  // Reset to the first page whenever a filter changes the result set.
  useEffect(() => {
    setPage(1);
  }, [sourceFilter, categoryFilter, difficultyFilter]);

  // Clamp the page if the list shrinks (e.g. after deleting a course).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginatedCourses = filteredCourses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading(
      dict["admin.uploadingCourseImage"] || "Uploading course image..."
    );
    try {
      const url = await uploadImage(formData);
      set("imageSrc", url);
      toast.success(
        dict["admin.imageUploaded"] || "Image uploaded successfully!",
        { id: toastId }
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : dict["admin.uploadFailed"] || "Upload failed.",
        { id: toastId }
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title.trim()) {
      toast.error(dict["admin.titleRequired"] || "Title is required.");
      return;
    }

    startTransition(() => {
      const action = editingId
        ? updateCourse(editingId, form, lang)
        : createCourse(form, lang);

      action
        .then(() => {
          toast.success(
            editingId
              ? dict["admin.courseUpdated"] || "Course updated."
              : dict["admin.courseCreated"] || "Course created."
          );
          setOpen(false);
          router.refresh();
        })
        .catch(() =>
          toast.error(
            dict["common.somethingWentWrong"] || "Something went wrong."
          )
        );
    });
  };

  const onDelete = (course: AdminCourse) => {
    if (
      !window.confirm(
        `${dict["admin.deleteCoursePrefix"] || "Delete"} "${course.title}"? ${
          dict["admin.deleteCourseConfirm"] ||
          "This removes its units, lessons and all progress."
        }`
      )
    )
      return;

    startTransition(() => {
      deleteCourse(course.id, lang)
        .then(() => {
          toast.success(dict["admin.courseDeleted"] || "Course deleted.");
          router.refresh();
        })
        .catch(() =>
          toast.error(
            dict["common.somethingWentWrong"] || "Something went wrong."
          )
        );
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={openCreate} disabled={pending}>
          <Plus className="mr-1 h-5 w-5" />{" "}
          {dict["admin.createCourse"] || "Create Course"}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-[24px] border-2 border-slate-100 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {dict["admin.filterSource"] || "Source"}
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">{dict["admin.allSources"] || "All Sources"}</option>
            <option value="SYSTEM">
              {dict["admin.systemCourses"] || "System Courses"}
            </option>
            <option value="MY_COURSE">
              {dict["admin.myCourses"] || "My Courses"}
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {dict["admin.filterCategory"] || "Category"}
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">
              {dict["admin.allCategories"] || "All Categories"}
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {dict["admin.filterDifficulty"] || "Difficulty"}
          </label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">
              {dict["admin.allDifficulties"] || "All Difficulties"}
            </option>
            <option value="Beginner">
              {dict["admin.beginner"] || "Beginner"}
            </option>
            <option value="Intermediate">
              {dict["admin.intermediate"] || "Intermediate"}
            </option>
            <option value="Advanced">
              {dict["admin.advanced"] || "Advanced"}
            </option>
          </select>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          {dict["admin.noCoursesCreateFirst"] ||
            "No courses yet. Create your first one!"}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          {dict["admin.noCoursesMatchFilter"] ||
            "No courses match your filter criteria."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paginatedCourses.map((course) => (
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
                    <h3 className="font-extrabold text-slate-800">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500">{course.category}</p>
                    {course.createdBy === null ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                        <ShieldCheck className="h-3 w-3" />
                        {dict["admin.createdBySystem"] || "System"}
                      </span>
                    ) : (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                        <UserCircle className="h-3 w-3" />
                        {dict["admin.createdBy"] || "By"}{" "}
                        {course.creatorName ||
                          dict["admin.unknownCreator"] ||
                          "Unknown"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                      onClick={() => openEdit(course)}
                      disabled={pending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                      onClick={() => onDelete(course)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {course.description ||
                    dict["admin.noDescription"] ||
                    "No description."}
                </p>

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
                    <Settings2 className="h-3.5 w-3.5" />{" "}
                    {dict["admin.content"] || "Content"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCourses.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm font-medium text-slate-400">
            {dict["admin.showing"] || "Showing"}{" "}
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filteredCourses.length)}{" "}
            {dict["common.of"] || "of"} {filteredCourses.length}
          </p>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId
                ? dict["admin.editCourse"] || "Edit course"
                : dict["admin.createCourseTitle"] || "Create course"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">{dict["admin.fieldTitle"] || "Title"}</Label>
              <AiInput
                id="title"
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={dict["admin.titlePlaceholder"] || "e.g. Science Explorer"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">
                {dict["admin.fieldCategory"] || "Category"}
              </Label>
              <AiInput
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder={dict["admin.categoryPlaceholder"] || "e.g. Science"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imageSrc">
                {dict["admin.imagePathOrUrl"] || "Image path or URL"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imageSrc"
                  value={form.imageSrc}
                  onChange={(e) => set("imageSrc", e.target.value)}
                  placeholder="/math.svg"
                  className="flex-1"
                />
                <label className="cursor-pointer bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-3 py-2 text-xs font-bold shrink-0 hover:bg-indigo-100 transition flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  {dict["common.upload"] || "Upload"}
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
              <Label>{dict["admin.fieldDifficulty"] || "Difficulty"}</Label>
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
                    {dict[
                      `admin.${d.toLowerCase()}` as keyof typeof dict
                    ] || d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                {dict["admin.fieldDescription"] || "Description"}
              </Label>
              <AiTextarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={
                  dict["admin.descriptionPlaceholder"] || "What will kids learn?"
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="primaryOutline"
                onClick={() => setOpen(false)}
                disabled={pending || uploading}
              >
                {dict["common.cancel"] || "Cancel"}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={pending || uploading}
              >
                {editingId
                  ? dict["admin.saveChanges"] || "Save changes"
                  : dict["common.create"] || "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

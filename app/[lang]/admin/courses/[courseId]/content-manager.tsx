"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  Layers,
  BookOpen,
  HelpCircle,
  Type,
  Image as ImageIcon,
  X,
  GripVertical,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
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
  createUnit,
  updateUnit,
  deleteUnit,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/actions/content";
import {
  createLessonBlock,
  updateLessonBlock,
  deleteLessonBlock,
  reorderLessonBlocks,
  uploadImage,
} from "@/actions/lesson-block";
import { BlockInput } from "@/actions/lesson-block";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Option = {
  id: number;
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
};

type Block = {
  id: number;
  question: string | null;
  type: string;
  order: number;
  body: string | null;
  imageSrc: string | null;
  caption: string | null;
  lessonBlockOptions: Option[];
};

type Lesson = {
  id: number;
  title: string;
  order: number;
  lessonBlocks: Block[];
};

type Unit = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
};

export type CourseTree = {
  id: number;
  title: string;
  units: Unit[];
};

type Kind = "unit" | "lesson" | "block";

type FormOption = {
  id?: number;
  text: string;
  correct: boolean;
  imageSrc: string;
  audioSrc: string;
};

type Form = {
  title: string;
  description: string;
  order: number;
  question: string;
  type: "TEXT" | "IMAGE" | "SELECT" | "ASSIST";
  body: string;
  caption: string;
  imageSrc: string;
  options: FormOption[];
};

const defaultOptions = (): FormOption[] => [
  { text: "", correct: false, imageSrc: "", audioSrc: "" },
  { text: "", correct: false, imageSrc: "", audioSrc: "" },
];

const emptyForm: Form = {
  title: "",
  description: "",
  order: 1,
  question: "",
  type: "SELECT",
  body: "",
  caption: "",
  imageSrc: "",
  options: defaultOptions(),
};

export const ContentManager = ({
  course,
  lang,
}: {
  course: CourseTree;
  lang: string;
}) => {
  const courseId = course.id;
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const kindLabel = (kind: Kind) =>
    ({
      unit: dict["admin.unit"] || "Unit",
      lesson: dict["admin.lesson"] || "Lesson",
      block: dict["admin.block"] || "Block",
    })[kind];

  const [openUnits, setOpenUnits] = useState<Set<number>>(new Set());
  const [openLessons, setOpenLessons] = useState<Set<number>>(new Set());
  const [openBlocks, setOpenBlocks] = useState<Set<number>>(new Set());

  // Drag and drop block tracking
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);

  // File upload state
  const [uploading, setUploading] = useState(false);

  // Track the active inline editor (or dialog editor)
  const [editor, setEditor] = useState<{
    kind: Kind;
    mode: "create" | "edit";
    parentId: number; // unitId / lessonId / blockId for creates; for unit create it is courseId
    entityId?: number;
  } | null>(null);

  const [form, setForm] = useState<Form>(emptyForm);

  const toggle = (
    set: React.Dispatch<React.SetStateAction<Set<number>>>,
    id: number
  ) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = (kind: Kind, parentId: number, nextOrder: number) => {
    setEditor({ kind, mode: "create", parentId });
    setForm({ ...emptyForm, order: nextOrder, options: defaultOptions() });
  };

  const openEdit = (
    kind: Kind,
    parentId: number,
    entityId: number,
    values: Partial<Form>
  ) => {
    setEditor({ kind, mode: "edit", parentId, entityId });
    setForm({ ...emptyForm, ...values });
  };

  const cancelEditor = () => {
    setEditor(null);
    setForm(emptyForm);
  };

  const runAction = (promise: Promise<unknown>, successMsg: string) => {
    startTransition(() => {
      promise
        .then(() => {
          toast.success(successMsg);
          setEditor(null);
          router.refresh();
        })
        .catch((e) =>
          toast.error(
            e instanceof Error
              ? e.message
              : dict["common.somethingWentWrong"] || "Something went wrong."
          )
        );
    });
  };

  const handleBlockDrop = (targetId: number, blocks: Block[]) => {
    if (draggedBlockId === null || draggedBlockId === targetId) return;

    const dragIndex = blocks.findIndex((b) => b.id === draggedBlockId);
    const hoverIndex = blocks.findIndex((b) => b.id === targetId);
    if (dragIndex === -1 || hoverIndex === -1) return;

    const reordered = [...blocks];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(hoverIndex, 0, removed);

    const updates = reordered.map((b, idx) => ({
      id: b.id,
      order: idx + 1,
    }));

    setDraggedBlockId(null);
    runAction(
      reorderLessonBlocks(updates, courseId, lang),
      dict["admin.blocksReordered"] || "Blocks reordered successfully."
    );
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading(
      dict["admin.uploadingImage"] || "Uploading image..."
    );
    try {
      const url = await uploadImage(formData);
      onUploaded(url);
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

  const onSubmit = () => {
    if (!editor) return;
    const { kind, mode, parentId, entityId } = editor;
    const verb =
      mode === "create"
        ? dict["admin.verbCreated"] || "created"
        : dict["admin.verbUpdated"] || "updated";
    const msg = `${kindLabel(kind)} ${verb}.`;

    if (kind === "unit") {
      const data = {
        title: form.title,
        description: form.description,
        order: form.order,
      };
      runAction(
        mode === "create"
          ? createUnit(courseId, data, lang)
          : updateUnit(entityId!, courseId, data, lang),
        msg
      );
    } else if (kind === "lesson") {
      const data = { title: form.title, order: form.order };
      runAction(
        mode === "create"
          ? createLesson(parentId, courseId, data, lang)
          : updateLesson(entityId!, courseId, data, lang),
        msg
      );
    } else if (kind === "block") {
      const data: BlockInput =
        form.type === "TEXT"
          ? { type: "TEXT", order: form.order, body: form.body }
          : form.type === "IMAGE"
          ? { type: "IMAGE", order: form.order, imageSrc: form.imageSrc, caption: form.caption }
          : {
              type: form.type as "SELECT" | "ASSIST",
              order: form.order,
              question: form.question,
              options: form.options.filter((o) => o.text.trim() !== ""),
            };

      runAction(
        mode === "create"
          ? createLessonBlock(parentId, courseId, data, lang)
          : updateLessonBlock(entityId!, courseId, data, lang),
        msg
      );
    }
  };

  const confirmDelete = (
    kind: Kind,
    label: string,
    promise: () => Promise<unknown>
  ) => {
    const extra =
      " " +
      (dict["admin.deleteCascade"] ||
        "This cascades to everything nested under it.");
    if (
      !window.confirm(
        `${dict["admin.deletePrefix"] || "Delete"} ${kindLabel(
          kind
        ).toLowerCase()} "${label}"?${extra}`
      )
    )
      return;
    runAction(
      promise(),
      `${kindLabel(kind)} ${dict["admin.verbDeleted"] || "deleted"}.`
    );
  };

  const getBlockIcon = (type: string) => {
    if (type === "TEXT") return <Type className="h-4 w-4 shrink-0 text-blue-500" />;
    if (type === "IMAGE") return <ImageIcon className="h-4 w-4 shrink-0 text-emerald-500" />;
    return <HelpCircle className="h-4 w-4 shrink-0 text-purple-500" />;
  };

  const getBlockTitle = (block: Block) => {
    if (block.type === "TEXT")
      return block.body
        ? block.body.substring(0, 40) + (block.body.length > 40 ? "..." : "")
        : dict["admin.textBlock"] || "Text Block";
    if (block.type === "IMAGE")
      return block.caption || dict["admin.imageBlock"] || "Image Block";
    return block.question || dict["admin.question"] || "Question";
  };

  // Render Inline Form for block ONLY
  const renderInlineBlockForm = () => {
    if (!editor || editor.kind !== "block") return null;

    const isSaveDisabled =
      pending ||
      uploading ||
      (form.type === "TEXT" && !form.body) ||
      (form.type === "IMAGE" && !form.imageSrc) ||
      ((form.type === "SELECT" || form.type === "ASSIST") && !form.question);

    return (
      <div className="my-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 p-4 transition-all space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
          <span className="text-sm font-bold text-indigo-700">
            {editor.mode === "create"
              ? dict["admin.addNew"] || "Add New"
              : dict["common.edit"] || "Edit"}{" "}
            {dict["admin.block"] || "Block"} ({form.type})
          </span>
          <button
            onClick={cancelEditor}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {(form.type === "SELECT" || form.type === "ASSIST") && (
            <>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">
                  {dict["admin.question"] || "Question"}
                </Label>
                <Input
                  value={form.question}
                  onChange={(e) => setField("question", e.target.value)}
                  placeholder={
                    dict["admin.questionPlaceholder"] ||
                    "e.g., Which of these is 'the apple'?"
                  }
                  className="bg-white"
                />
              </div>

              {/* Inline Options Editing */}
              <div className="space-y-3 border-t border-indigo-100 pt-3">
                <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  {dict["admin.answerOptions"] || "Answer Options"}
                </Label>
                <div className="divide-y divide-slate-200">
                  {form.options.map((opt, optIdx) => (
                    <div key={optIdx} className="py-3 first:pt-0 last:pb-0 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">
                          {dict["admin.option"] || "Option"} #{optIdx + 1}
                        </span>
                        {form.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = [...form.options];
                              newOpts.splice(optIdx, 1);
                              setField("options", newOpts);
                            }}
                            className="text-xs text-rose-500 hover:underline flex items-center gap-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />{" "}
                            {dict["admin.remove"] || "Remove"}
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...form.options];
                              newOpts[optIdx] = { ...newOpts[optIdx], text: e.target.value };
                              setField("options", newOpts);
                            }}
                            placeholder={dict["admin.optionText"] || "Option text"}
                            className="h-8 text-sm bg-white"
                          />
                        </div>
                        <div className="flex flex-wrap gap-4 items-center pt-1">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opt.correct}
                              onChange={(e) => {
                                const newOpts = [...form.options];
                                newOpts[optIdx] = { ...newOpts[optIdx], correct: e.target.checked };
                                setField("options", newOpts);
                              }}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            {dict["admin.correctOption"] || "Correct Option"}
                          </label>
                          <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                            <Input
                              value={opt.imageSrc}
                              onChange={(e) => {
                                const newOpts = [...form.options];
                                newOpts[optIdx] = { ...newOpts[optIdx], imageSrc: e.target.value };
                                setField("options", newOpts);
                              }}
                              placeholder={
                                dict["admin.imageUrlOptional"] ||
                                "Image URL (optional)"
                              }
                              className="h-7 text-[11px] px-2 bg-white flex-1"
                            />
                            <label className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 hover:bg-slate-100 transition shrink-0">
                              <Upload className="h-3.5 w-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageUpload(e, (url) => {
                                    const newOpts = [...form.options];
                                    newOpts[optIdx] = { ...newOpts[optIdx], imageSrc: url };
                                    setField("options", newOpts);
                                  })
                                }
                              />
                            </label>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <Input
                              value={opt.audioSrc}
                              onChange={(e) => {
                                const newOpts = [...form.options];
                                newOpts[optIdx] = { ...newOpts[optIdx], audioSrc: e.target.value };
                                setField("options", newOpts);
                              }}
                              placeholder={
                                dict["admin.audioUrlOptional"] ||
                                "Audio URL (optional)"
                              }
                              className="h-7 text-[11px] px-2 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setField("options", [
                      ...form.options,
                      { text: "", correct: false, imageSrc: "", audioSrc: "" }
                    ]);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />{" "}
                  {dict["admin.addOption"] || "Add Option"}
                </button>
              </div>
            </>
          )}

          {form.type === "TEXT" && (
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">
                {dict["admin.bodyText"] || "Body Text"}
              </Label>
              <textarea
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-indigo-500"
                placeholder={
                  dict["admin.bodyTextPlaceholder"] ||
                  "Enter the lesson reading material here..."
                }
              />
            </div>
          )}

          {form.type === "IMAGE" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">
                  {dict["admin.image"] || "Image"}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={form.imageSrc}
                    onChange={(e) => setField("imageSrc", e.target.value)}
                    placeholder={
                      dict["admin.imageUrlOrUpload"] || "Image URL or upload"
                    }
                    className="bg-white flex-1 text-xs h-9"
                  />
                  <label className="cursor-pointer bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 hover:bg-indigo-100 transition flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    {dict["common.upload"] || "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, (url) => setField("imageSrc", url))}
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">
                  {dict["admin.captionOptional"] || "Caption (optional)"}
                </Label>
                <Input
                  value={form.caption}
                  onChange={(e) => setField("caption", e.target.value)}
                  placeholder={dict["admin.captionPlaceholder"] || "e.g., An apple"}
                  className="bg-white"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-indigo-100 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEditor}
            disabled={pending || uploading}
          >
            {dict["common.cancel"] || "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isSaveDisabled}
            onClick={onSubmit}
          >
            {dict["common.save"] || "Save"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => openCreate("unit", courseId, course.units.length + 1)}
        >
          <Plus className="mr-1 h-5 w-5" /> {dict["admin.addUnit"] || "Add Unit"}
        </Button>
      </div>

      {course.units.length === 0 && (
        <div className="rounded-[24px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          {dict["admin.noUnitsYet"] ||
            "No units yet. Add your first unit to start building lessons."}
        </div>
      )}

      {course.units.map((unit) => {
        const unitOpen = openUnits.has(unit.id);

        return (
          <div
            key={unit.id}
            className="overflow-hidden rounded-[24px] border-2 border-slate-100 bg-white shadow-sm"
          >
            {/* Unit row */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => toggle(setOpenUnits, unit.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <ChevronRight
                  className={cn(
                    "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                    unitOpen && "rotate-90"
                  )}
                />
                <Layers className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                  <div className="font-bold text-slate-800">{unit.title}</div>
                  <div className="text-xs text-slate-500">
                    {unit.description || dict["admin.noDescriptionShort"] || "No description"} ·{" "}
                    {unit.lessons.length} {dict["admin.lessonsLower"] || "lessons"}
                  </div>
                </div>
              </button>
              <RowActions
                disabled={pending}
                onEdit={() =>
                  openEdit("unit", courseId, unit.id, {
                    title: unit.title,
                    description: unit.description,
                    order: unit.order,
                  })
                }
                onDelete={() =>
                  confirmDelete("unit", unit.title, () =>
                    deleteUnit(unit.id, courseId, lang)
                  )
                }
              />
            </div>

            {/* Lessons */}
            {unitOpen && (
              <div className="space-y-3 border-t-2 border-slate-50 bg-slate-50/50 p-4 pl-6">
                {unit.lessons.map((lesson) => {
                  const lessonOpen = openLessons.has(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={() => toggle(setOpenLessons, lesson.id)}
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                              lessonOpen && "rotate-90"
                            )}
                          />
                          <BookOpen className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="font-bold text-slate-700">
                            {lesson.title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {lesson.lessonBlocks.length}{" "}
                            {dict["admin.blocksLower"] || "blocks"}
                          </span>
                        </button>
                        <RowActions
                          disabled={pending}
                          small
                          onEdit={() =>
                            openEdit("lesson", unit.id, lesson.id, {
                              title: lesson.title,
                              order: lesson.order,
                            })
                          }
                          onDelete={() =>
                            confirmDelete("lesson", lesson.title, () =>
                              deleteLesson(lesson.id, courseId, lang)
                            )
                          }
                        />
                      </div>

                      {/* Blocks */}
                      {lessonOpen && (
                        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-3 pl-5">
                          {lesson.lessonBlocks.map((block) => {
                            const blockOpen = openBlocks.has(block.id);
                            const isInteractive = block.type === "SELECT" || block.type === "ASSIST";
                            const isEditingThisBlock = editor?.kind === "block" && editor.mode === "edit" && editor.entityId === block.id;

                            return (
                              <div
                                key={block.id}
                                draggable={editor === null}
                                onDragStart={() => setDraggedBlockId(block.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleBlockDrop(block.id, lesson.lessonBlocks)}
                                className={cn(
                                  "overflow-hidden rounded-xl border border-slate-200 bg-white transition-all",
                                  draggedBlockId === block.id && "opacity-50 border-dashed border-indigo-300 bg-indigo-50/10 cursor-grabbing",
                                  editor === null && "cursor-grab hover:border-slate-300"
                                )}
                              >
                                {isEditingThisBlock ? (
                                  <div className="p-3 bg-slate-50/50">
                                    {renderInlineBlockForm()}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-3">
                                    <div className="text-slate-400 cursor-grab shrink-0 pr-1">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <button
                                      onClick={() => toggle(setOpenBlocks, block.id)}
                                      className="flex flex-1 items-center gap-2 text-left"
                                    >
                                      <ChevronRight
                                        className={cn(
                                          "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                                          blockOpen && "rotate-90"
                                        )}
                                      />
                                      {getBlockIcon(block.type)}
                                      <span className="text-sm font-bold text-slate-700">
                                        {getBlockTitle(block)}
                                      </span>
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                        {block.type}
                                      </span>
                                    </button>
                                    <RowActions
                                      disabled={pending}
                                      small
                                      onEdit={() =>
                                        openEdit("block", lesson.id, block.id, {
                                          type: block.type as any,
                                          question: block.question || "",
                                          body: block.body || "",
                                          caption: block.caption || "",
                                          imageSrc: block.imageSrc || "",
                                          options: block.lessonBlockOptions.map((o) => ({
                                            id: o.id,
                                            text: o.text,
                                            correct: o.correct,
                                            imageSrc: o.imageSrc || "",
                                            audioSrc: o.audioSrc || "",
                                          })),
                                        })
                                      }
                                      onDelete={() =>
                                        confirmDelete("block", getBlockTitle(block), () =>
                                          deleteLessonBlock(block.id, courseId, lang)
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {/* Options (Viewing Mode) */}
                                {blockOpen && isInteractive && !isEditingThisBlock && (
                                  <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/70 p-3 pl-10">
                                    {block.lessonBlockOptions.map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5"
                                      >
                                        <span
                                          className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white",
                                            opt.correct ? "bg-emerald-500" : "bg-slate-200"
                                          )}
                                        >
                                          {opt.correct && <Check className="h-2.5 w-2.5" />}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700">{opt.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Text Content (Viewing Mode) */}
                                {blockOpen && block.type === "TEXT" && !isEditingThisBlock && (
                                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 pl-10 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {block.body}
                                  </div>
                                )}

                                {/* Image Preview (Viewing Mode) */}
                                {blockOpen && block.type === "IMAGE" && !isEditingThisBlock && (
                                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 pl-10 space-y-2">
                                    {block.imageSrc && (
                                      <img
                                        src={block.imageSrc}
                                        alt={block.caption || "Image"}
                                        className="max-h-[120px] rounded-lg border border-slate-200 bg-white object-contain p-1"
                                      />
                                    )}
                                    {block.caption && (
                                      <p className="text-xs font-semibold text-slate-500 italic">
                                        {dict["admin.captionLabel"] || "Caption"}:{" "}
                                        {block.caption}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {editor?.kind === "block" && editor.mode === "create" && editor.parentId === lesson.id && renderInlineBlockForm()}

                          {!(editor?.kind === "block" && editor.mode === "create" && editor.parentId === lesson.id) && (
                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 mt-1">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {dict["admin.addBlock"] || "Add Block:"}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 px-3 h-8 border border-blue-100 rounded-xl"
                                  onClick={() => {
                                    openCreate("block", lesson.id, lesson.lessonBlocks.length + 1);
                                    setForm((f) => ({ ...f, type: "TEXT" }));
                                  }}
                                >
                                  <Type className="h-3.5 w-3.5" />{" "}
                                  {dict["admin.text"] || "Text"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 px-3 h-8 border border-emerald-100 rounded-xl"
                                  onClick={() => {
                                    openCreate("block", lesson.id, lesson.lessonBlocks.length + 1);
                                    setForm((f) => ({ ...f, type: "IMAGE" }));
                                  }}
                                >
                                  <ImageIcon className="h-3.5 w-3.5" />{" "}
                                  {dict["admin.image"] || "Image"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-purple-50 text-purple-600 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5 px-3 h-8 border border-purple-100 rounded-xl"
                                  onClick={() => {
                                    openCreate("block", lesson.id, lesson.lessonBlocks.length + 1);
                                    setForm((f) => ({ ...f, type: "SELECT" }));
                                  }}
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />{" "}
                                  {dict["admin.qaSelect"] || "Q&A Select"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-pink-50 text-pink-600 hover:bg-pink-100 text-xs font-bold flex items-center gap-1.5 px-3 h-8 border border-pink-100 rounded-xl"
                                  onClick={() => {
                                    openCreate("block", lesson.id, lesson.lessonBlocks.length + 1);
                                    setForm((f) => ({ ...f, type: "ASSIST" }));
                                  }}
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />{" "}
                                  {dict["admin.qaAssist"] || "Q&A Assist"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => openCreate("lesson", unit.id, unit.lessons.length + 1)}
                  disabled={pending}
                  className="flex items-center gap-1 px-1 py-1 text-sm font-bold text-indigo-600 hover:underline disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> {dict["admin.addLesson"] || "Add lesson"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Editor Modal for Units and Lessons */}
      <Dialog
        open={editor !== null && (editor.kind === "unit" || editor.kind === "lesson")}
        onOpenChange={(open) => !open && cancelEditor()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "create"
                ? dict["admin.add"] || "Add"
                : dict["common.edit"] || "Edit"}{" "}
              {editor?.kind ? kindLabel(editor.kind) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">


            <div className="space-y-2">
              <Label>{dict["admin.fieldTitle"] || "Title"}</Label>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            {editor?.kind === "unit" && (
              <div className="space-y-2">
                <Label>{dict["admin.fieldDescription"] || "Description"}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={cancelEditor} disabled={pending}>
              {dict["common.cancel"] || "Cancel"}
            </Button>
            <Button
              variant="primary"
              disabled={pending || !form.title}
              onClick={onSubmit}
            >
              {dict["common.save"] || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Helper Component --------------------------------------------------------

const RowActions = ({
  onEdit,
  onDelete,
  disabled,
  small,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  small?: boolean;
}) => (
  <div className="flex shrink-0 gap-1">
    <Button
      variant="ghost"
      size={small ? "sm" : "default"}
      className={cn("h-8 w-8 p-0 text-slate-400 hover:text-indigo-500")}
      disabled={disabled}
      onClick={onEdit}
    >
      <Pencil className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size={small ? "sm" : "default"}
      className={cn("h-8 w-8 p-0 text-slate-400 hover:text-rose-500")}
      disabled={disabled}
      onClick={onDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

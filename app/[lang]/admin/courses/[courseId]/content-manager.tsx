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
  createChallenge,
  updateChallenge,
  deleteChallenge,
  createOption,
  updateOption,
  deleteOption,
} from "@/actions/content";

type Option = {
  id: number;
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
};
type Challenge = {
  id: number;
  question: string;
  type: "SELECT" | "ASSIST";
  order: number;
  challengeOptions: Option[];
};
type Lesson = {
  id: number;
  title: string;
  order: number;
  challenges: Challenge[];
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

type Kind = "unit" | "lesson" | "challenge" | "option";

type Form = {
  title: string;
  description: string;
  order: number;
  question: string;
  type: "SELECT" | "ASSIST";
  text: string;
  correct: boolean;
  imageSrc: string;
  audioSrc: string;
};

const emptyForm: Form = {
  title: "",
  description: "",
  order: 1,
  question: "",
  type: "SELECT",
  text: "",
  correct: false,
  imageSrc: "",
  audioSrc: "",
};

const KIND_LABEL: Record<Kind, string> = {
  unit: "Unit",
  lesson: "Lesson",
  challenge: "Challenge",
  option: "Option",
};

export const ContentManager = ({
  course,
  lang,
}: {
  course: CourseTree;
  lang: string;
}) => {
  const courseId = course.id;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [openUnits, setOpenUnits] = useState<Set<number>>(new Set());
  const [openLessons, setOpenLessons] = useState<Set<number>>(new Set());
  const [openChallenges, setOpenChallenges] = useState<Set<number>>(new Set());

  const [dialog, setDialog] = useState<{
    open: boolean;
    kind: Kind;
    mode: "create" | "edit";
    parentId: number; // unitId / lessonId / challengeId for creates; for unit create it is courseId
    entityId?: number;
  }>({ open: false, kind: "unit", mode: "create", parentId: courseId });
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
    setDialog({ open: true, kind, mode: "create", parentId });
    setForm({ ...emptyForm, order: nextOrder });
  };

  const openEdit = (
    kind: Kind,
    parentId: number,
    entityId: number,
    values: Partial<Form>
  ) => {
    setDialog({ open: true, kind, mode: "edit", parentId, entityId });
    setForm({ ...emptyForm, ...values });
  };

  const runAction = (promise: Promise<unknown>, successMsg: string) => {
    startTransition(() => {
      promise
        .then(() => {
          toast.success(successMsg);
          setDialog((d) => ({ ...d, open: false }));
          router.refresh();
        })
        .catch((e) =>
          toast.error(e instanceof Error ? e.message : "Something went wrong.")
        );
    });
  };

  const onSubmit = () => {
    const { kind, mode, parentId, entityId } = dialog;
    const verb = mode === "create" ? "created" : "updated";
    const msg = `${KIND_LABEL[kind]} ${verb}.`;

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
    } else if (kind === "challenge") {
      const data = {
        question: form.question,
        type: form.type,
        order: form.order,
      };
      runAction(
        mode === "create"
          ? createChallenge(parentId, courseId, data, lang)
          : updateChallenge(entityId!, courseId, data, lang),
        msg
      );
    } else {
      const data = {
        text: form.text,
        correct: form.correct,
        imageSrc: form.imageSrc,
        audioSrc: form.audioSrc,
      };
      runAction(
        mode === "create"
          ? createOption(parentId, courseId, data, lang)
          : updateOption(entityId!, courseId, data, lang),
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
      kind === "option"
        ? ""
        : " This cascades to everything nested under it.";
    if (!window.confirm(`Delete ${kind} "${label}"?${extra}`)) return;
    runAction(promise(), `${KIND_LABEL[kind]} deleted.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => openCreate("unit", courseId, course.units.length + 1)}
        >
          <Plus className="mr-1 h-5 w-5" /> Add Unit
        </Button>
      </div>

      {course.units.length === 0 && (
        <div className="rounded-[24px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          No units yet. Add your first unit to start building lessons.
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
                    {unit.description || "No description"} · {unit.lessons.length}{" "}
                    lessons
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
                            {lesson.challenges.length} challenges
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

                      {/* Challenges */}
                      {lessonOpen && (
                        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-3 pl-5">
                          {lesson.challenges.map((challenge) => {
                            const chOpen = openChallenges.has(challenge.id);
                            return (
                              <div
                                key={challenge.id}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                              >
                                <div className="flex items-center gap-2 p-3">
                                  <button
                                    onClick={() =>
                                      toggle(setOpenChallenges, challenge.id)
                                    }
                                    className="flex flex-1 items-center gap-2 text-left"
                                  >
                                    <ChevronRight
                                      className={cn(
                                        "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                                        chOpen && "rotate-90"
                                      )}
                                    />
                                    <HelpCircle className="h-4 w-4 shrink-0 text-purple-500" />
                                    <span className="text-sm font-bold text-slate-700">
                                      {challenge.question}
                                    </span>
                                    <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-600">
                                      {challenge.type}
                                    </span>
                                  </button>
                                  <RowActions
                                    disabled={pending}
                                    small
                                    onEdit={() =>
                                      openEdit(
                                        "challenge",
                                        lesson.id,
                                        challenge.id,
                                        {
                                          question: challenge.question,
                                          type: challenge.type,
                                          order: challenge.order,
                                        }
                                      )
                                    }
                                    onDelete={() =>
                                      confirmDelete(
                                        "challenge",
                                        challenge.question,
                                        () =>
                                          deleteChallenge(
                                            challenge.id,
                                            courseId,
                                            lang
                                          )
                                      )
                                    }
                                  />
                                </div>

                                {/* Options */}
                                {chOpen && (
                                  <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/70 p-3 pl-5">
                                    {challenge.challengeOptions.map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                      >
                                        <span
                                          className={cn(
                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                            opt.correct
                                              ? "bg-emerald-500 text-white"
                                              : "bg-slate-200 text-slate-400"
                                          )}
                                        >
                                          {opt.correct && (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </span>
                                        <span className="flex-1 text-sm font-medium text-slate-700">
                                          {opt.text}
                                        </span>
                                        <RowActions
                                          disabled={pending}
                                          small
                                          onEdit={() =>
                                            openEdit(
                                              "option",
                                              challenge.id,
                                              opt.id,
                                              {
                                                text: opt.text,
                                                correct: opt.correct,
                                                imageSrc: opt.imageSrc ?? "",
                                                audioSrc: opt.audioSrc ?? "",
                                              }
                                            )
                                          }
                                          onDelete={() =>
                                            confirmDelete("option", opt.text, () =>
                                              deleteOption(opt.id, courseId, lang)
                                            )
                                          }
                                        />
                                      </div>
                                    ))}
                                    <button
                                      onClick={() =>
                                        openCreate("option", challenge.id, 0)
                                      }
                                      disabled={pending}
                                      className="flex items-center gap-1 px-1 py-1 text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50"
                                    >
                                      <Plus className="h-3.5 w-3.5" /> Add option
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button
                            onClick={() =>
                              openCreate(
                                "challenge",
                                lesson.id,
                                lesson.challenges.length + 1
                              )
                            }
                            disabled={pending}
                            className="flex items-center gap-1 px-1 py-1 text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add challenge
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() =>
                    openCreate("lesson", unit.id, unit.lessons.length + 1)
                  }
                  disabled={pending}
                  className="flex items-center gap-1 px-1 py-1 text-sm font-bold text-indigo-600 hover:underline disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add lesson
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Shared dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {dialog.mode === "create" ? "Add" : "Edit"} {KIND_LABEL[dialog.kind]}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {dialog.kind === "unit" && (
              <>
                <Field label="Title">
                  <Input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Unit 1"
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Learn the basics"
                  />
                </Field>
                <OrderField value={form.order} onChange={(v) => setField("order", v)} />
              </>
            )}

            {dialog.kind === "lesson" && (
              <>
                <Field label="Title">
                  <Input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Nouns"
                  />
                </Field>
                <OrderField value={form.order} onChange={(v) => setField("order", v)} />
              </>
            )}

            {dialog.kind === "challenge" && (
              <>
                <Field label="Question">
                  <textarea
                    value={form.question}
                    onChange={(e) => setField("question", e.target.value)}
                    rows={2}
                    placeholder='Which one of these is "the man"?'
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>
                <Field label="Type">
                  <div className="flex gap-2">
                    {(["SELECT", "ASSIST"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setField("type", t)}
                        className={cn(
                          "flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold transition-colors",
                          form.type === t
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <OrderField value={form.order} onChange={(v) => setField("order", v)} />
              </>
            )}

            {dialog.kind === "option" && (
              <>
                <Field label="Text">
                  <Input
                    value={form.text}
                    onChange={(e) => setField("text", e.target.value)}
                    placeholder="man"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => setField("correct", !form.correct)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors",
                    form.correct
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border-2",
                      form.correct
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300"
                    )}
                  >
                    {form.correct && <Check className="h-3.5 w-3.5" />}
                  </span>
                  Correct answer
                </button>
                <Field label="Image path (optional)">
                  <Input
                    value={form.imageSrc}
                    onChange={(e) => setField("imageSrc", e.target.value)}
                    placeholder="/man.svg"
                  />
                </Field>
                <Field label="Audio path (optional)">
                  <Input
                    value={form.audioSrc}
                    onChange={(e) => setField("audioSrc", e.target.value)}
                    placeholder="/es_man.mp3"
                  />
                </Field>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="primaryOutline"
              onClick={() => setDialog((d) => ({ ...d, open: false }))}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={onSubmit} disabled={pending}>
              {dialog.mode === "create" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);

const OrderField = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <Field label="Order">
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  </Field>
);

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
}) => {
  const size = small ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex shrink-0 gap-1">
      <button
        onClick={onEdit}
        disabled={disabled}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
        title="Edit"
      >
        <Pencil className={size} />
      </button>
      <button
        onClick={onDelete}
        disabled={disabled}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className={size} />
      </button>
    </div>
  );
};

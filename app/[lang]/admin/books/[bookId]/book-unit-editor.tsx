"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  FileText,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AiInput } from "@/components/ui/ai-input";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/books/rich-text-editor";
import {
  createBookUnit,
  updateBookUnit,
  deleteBookUnit,
  reorderBookUnits,
} from "@/actions/book";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Unit = { id: number; title: string; content: string };

export const BookUnitEditor = ({
  bookId,
  initialUnits,
  lang,
}: {
  bookId: number;
  initialUnits: Unit[];
  lang: string;
}) => {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialUnits[0]?.id ?? null
  );

  // Working copy of the selected unit.
  const selected = units.find((u) => u.id === selectedId) ?? null;
  const [draftTitle, setDraftTitle] = useState(selected?.title ?? "");
  const [draftContent, setDraftContent] = useState(selected?.content ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () =>
      !!selected &&
      (draftTitle !== selected.title || draftContent !== selected.content),
    [selected, draftTitle, draftContent]
  );

  const loadUnit = (u: Unit) => {
    setSelectedId(u.id);
    setDraftTitle(u.title);
    setDraftContent(u.content);
  };

  const selectUnit = (u: Unit) => {
    if (u.id === selectedId) return;
    if (
      dirty &&
      !window.confirm(
        dict["admin.discardUnsaved"] || "Discard unsaved changes to this unit?"
      )
    )
      return;
    loadUnit(u);
  };

  const save = () => {
    if (!selected) return;
    setSaving(true);
    updateBookUnit(selected.id, bookId, { title: draftTitle, content: draftContent }, lang)
      .then(() => {
        setUnits((prev) =>
          prev.map((u) =>
            u.id === selected.id
              ? { ...u, title: draftTitle, content: draftContent }
              : u
          )
        );
        toast.success(dict["admin.unitSaved"] || "Unit saved.");
        router.refresh();
      })
      .catch(() =>
        toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
      )
      .finally(() => setSaving(false));
  };

  const addUnit = () => {
    startTransition(() => {
      createBookUnit(
        bookId,
        { title: dict["admin.newUnitTitle"] || "New unit", content: "" },
        lang
      )
        .then((res) => {
          const u: Unit = {
            id: res.id,
            title: dict["admin.newUnitTitle"] || "New unit",
            content: "",
          };
          setUnits((prev) => [...prev, u]);
          loadUnit(u);
          router.refresh();
        })
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  const onDelete = (unit: Unit) => {
    if (!window.confirm(dict["admin.deleteUnitConfirm"] || "Delete this unit?"))
      return;
    startTransition(() => {
      deleteBookUnit(unit.id, bookId, lang)
        .then(() => {
          setUnits((prev) => {
            const next = prev.filter((u) => u.id !== unit.id);
            if (selectedId === unit.id) {
              const fallback = next[0] ?? null;
              if (fallback) loadUnit(fallback);
              else {
                setSelectedId(null);
                setDraftTitle("");
                setDraftContent("");
              }
            }
            return next;
          });
          toast.success(dict["admin.unitDeleted"] || "Unit deleted.");
          router.refresh();
        })
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= units.length) return;
    const next = [...units];
    [next[index], next[target]] = [next[target], next[index]];
    setUnits(next);
    startTransition(() => {
      reorderBookUnits(bookId, next.map((u) => u.id), lang)
        .then(() => router.refresh())
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
      {/* Units sidebar */}
      <aside className="flex flex-col rounded-[24px] border-2 border-slate-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {dict["admin.units"] || "Units"}
          </h2>
          <span className="text-xs font-bold text-slate-400">{units.length}</span>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {units.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-slate-400">
              {dict["admin.noUnitsYet"] || "No units yet. Add your first one."}
            </p>
          ) : (
            units.map((u, i) => (
              <div
                key={u.id}
                className={cn(
                  "group flex items-center gap-1 rounded-xl border-2 px-2 py-2 transition-colors",
                  u.id === selectedId
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-transparent hover:bg-slate-50"
                )}
              >
                <button
                  type="button"
                  onClick={() => selectUnit(u)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                      u.id === selectedId
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-sm font-bold",
                      u.id === selectedId ? "text-indigo-700" : "text-slate-700",
                      !u.title && "italic text-slate-400"
                    )}
                  >
                    {u.title || dict["admin.untitledUnit"] || "Untitled"}
                  </span>
                </button>
                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={pending || i === 0}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    title={dict["admin.moveUp"] || "Move up"}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={pending || i === units.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    title={dict["admin.moveDown"] || "Move down"}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(u)}
                    disabled={pending}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-rose-600"
                    title={dict["common.delete"] || "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Button
          variant="primaryOutline"
          className="mt-2 w-full"
          onClick={addUnit}
          disabled={pending}
        >
          <Plus className="mr-1 h-4 w-4" /> {dict["admin.addUnit"] || "Add unit"}
        </Button>
      </aside>

      {/* Content editor */}
      <section className="flex min-h-0 flex-col">
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-3">
              <AiInput
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={dict["admin.unitTitlePlaceholder"] || "Unit title"}
                className="flex-1 text-base font-bold"
              />
              <Button
                variant="primary"
                onClick={save}
                disabled={saving || !dirty}
                title={dict["admin.saveUnit"] || "Save unit"}
              >
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                {dict["common.save"] || "Save"}
              </Button>
            </div>

            <RichTextEditor
              key={selected.id}
              initialContent={draftContent}
              onChange={setDraftContent}
            />

            {dirty && (
              <p className="text-xs font-medium text-amber-600">
                {dict["admin.unsavedChanges"] || "You have unsaved changes."}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <FileText className="h-10 w-10 text-slate-300" />
            {dict["admin.selectOrAddUnit"] ||
              "Add a unit on the left to start writing."}
          </div>
        )}
      </section>
    </div>
  );
};

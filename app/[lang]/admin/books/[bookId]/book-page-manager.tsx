"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Plus,
  Pencil,
  Upload,
  X,
  FileText,
  ImageIcon,
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
import { uploadImage } from "@/actions/lesson-block";
import {
  createBookPage,
  updateBookPage,
  deleteBookPage,
  reorderBookPages,
  type BookPageInput,
} from "@/actions/book";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Page = {
  id: number;
  title: string;
  content: string;
  imageSrc: string;
};

const empty: BookPageInput = { title: "", content: "", imageSrc: "" };

export const BookPageManager = ({
  bookId,
  initialPages,
  lang,
}: {
  bookId: number;
  initialPages: Page[];
  lang: string;
}) => {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pages, setPages] = useState<Page[]>(initialPages);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BookPageInput>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof BookPageInput>(key: K, value: BookPageInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (page: Page) => {
    setEditingId(page.id);
    setForm({ title: page.title, content: page.content, imageSrc: page.imageSrc });
    setOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    setUploading(true);
    const toastId = toast.loading(dict["admin.uploadingImage"] || "Uploading...");
    try {
      const u = await uploadImage(fd);
      set("imageSrc", u);
      toast.success(dict["admin.imageUploaded"] || "Image uploaded!", { id: toastId });
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
    if (!form.content.trim() && !form.imageSrc.trim()) {
      toast.error(
        dict["admin.pageNeedsContent"] || "Add some text or an image for the page."
      );
      return;
    }

    setSaving(true);
    const action = editingId
      ? updateBookPage(editingId, bookId, form, lang)
      : createBookPage(bookId, form, lang);

    action
      .then(() => {
        toast.success(
          editingId
            ? dict["admin.pageUpdated"] || "Page updated."
            : dict["admin.pageAdded"] || "Page added."
        );
        setOpen(false);
        router.refresh();
      })
      .catch((err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : dict["common.somethingWentWrong"] || "Something went wrong."
        )
      )
      .finally(() => setSaving(false));
  };

  const persistOrder = (next: Page[]) => {
    setPages(next);
    startTransition(() => {
      reorderBookPages(bookId, next.map((p) => p.id), lang)
        .then(() => router.refresh())
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  };

  const onDelete = (page: Page) => {
    if (!window.confirm(dict["admin.deletePageConfirm"] || "Remove this page?")) return;
    startTransition(() => {
      deleteBookPage(page.id, bookId, lang)
        .then(() => {
          setPages((prev) => prev.filter((p) => p.id !== page.id));
          toast.success(dict["admin.pageDeleted"] || "Page removed.");
          router.refresh();
        })
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {dict["admin.pagesEditorHint"] ||
            "Each page has a title and text content, with an optional picture."}
        </p>
        <Button variant="primary" onClick={openCreate} disabled={pending}>
          <Plus className="mr-1 h-5 w-5" /> {dict["admin.addPage"] || "Add page"}
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <FileText className="h-10 w-10 text-slate-300" />
          {dict["admin.noPagesYet"] || "No pages yet. Add your first page."}
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="flex gap-4 rounded-[24px] border-2 border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-100"
            >
              {/* Order + reorder */}
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-black text-indigo-600">
                  {index + 1}
                </span>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600"
                    onClick={() => move(index, -1)}
                    disabled={pending || index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600"
                    onClick={() => move(index, 1)}
                    disabled={pending || index === pages.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Thumbnail (optional) */}
              {page.imageSrc ? (
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <Image
                    src={page.imageSrc}
                    alt={page.title || `${dict["admin.page"] || "Page"} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-300">
                  <FileText className="h-6 w-6" />
                </div>
              )}

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="truncate font-bold text-slate-800">
                  {page.title || (
                    <span className="text-slate-400">
                      {dict["admin.untitledPage"] || "Untitled page"}
                    </span>
                  )}
                </h3>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-slate-500">
                  {page.content || (
                    <span className="italic text-slate-300">
                      {dict["admin.imageOnlyPage"] || "Image only"}
                    </span>
                  )}
                </p>
                <div className="mt-auto flex justify-end gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                    onClick={() => openEdit(page)}
                    disabled={pending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                    onClick={() => onDelete(page)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit page dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId
                ? dict["admin.editPage"] || "Edit page"
                : dict["admin.addPage"] || "Add page"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pageTitle">
                {dict["admin.pageTitle"] || "Page title"}{" "}
                <span className="font-normal text-slate-400">
                  ({dict["common.optional"] || "optional"})
                </span>
              </Label>
              <Input
                id="pageTitle"
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={dict["admin.pageTitlePlaceholder"] || "e.g. Chapter 1"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pageContent">
                {dict["admin.pageContent"] || "Content"}
              </Label>
              <textarea
                id="pageContent"
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder={
                  dict["admin.pageContentPlaceholder"] ||
                  "Write the text for this page..."
                }
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pageImage">
                {dict["admin.pageImage"] || "Picture"}{" "}
                <span className="font-normal text-slate-400">
                  ({dict["common.optional"] || "optional"})
                </span>
              </Label>

              {form.imageSrc ? (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 p-2">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    <Image
                      src={form.imageSrc}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <span className="flex-1 truncate text-xs text-slate-500">
                    {form.imageSrc}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 text-slate-400 hover:text-rose-600"
                    onClick={() => set("imageSrc", "")}
                    title={dict["admin.removeImage"] || "Remove"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="pageImage"
                    value={form.imageSrc}
                    onChange={(e) => set("imageSrc", e.target.value)}
                    placeholder="https://…/picture.jpg"
                    className="flex-1"
                  />
                  <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100">
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {dict["common.upload"] || "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <ImageIcon className="h-3 w-3" />
                {dict["admin.pasteFromSearchHint"] ||
                  "Tip: use the assistant's Image Search, copy a URL, and paste it here."}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="primaryOutline"
                onClick={() => setOpen(false)}
                disabled={saving || uploading}
              >
                {dict["common.cancel"] || "Cancel"}
              </Button>
              <Button type="submit" variant="primary" disabled={saving || uploading}>
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : editingId ? (
                  dict["admin.saveChanges"] || "Save changes"
                ) : (
                  dict["admin.addPage"] || "Add page"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

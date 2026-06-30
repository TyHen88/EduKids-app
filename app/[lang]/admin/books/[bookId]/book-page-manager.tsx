"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  ImagePlus,
  Link2,
  Plus,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/actions/lesson-block";
import { addBookPages, deleteBookPage, reorderBookPages } from "@/actions/book";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Page = { id: number; imageSrc: string };

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
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);

  // --- Add by link (paste a URL — e.g. copied from the image search tool) ---
  const addByUrl = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = url.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value)) {
      toast.error(dict["admin.invalidImageUrl"] || "Enter a valid image URL.");
      return;
    }

    setAddingUrl(true);
    try {
      await addBookPages(bookId, [value], lang);
      setPages((prev) => [...prev, { id: -(prev.length + 1), imageSrc: value }]);
      setUrl("");
      toast.success(dict["admin.pageAdded"] || "Page added.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : dict["common.somethingWentWrong"] || "Something went wrong."
      );
    } finally {
      setAddingUrl(false);
    }
  };

  // --- Add by upload (one or more files) ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(
      `${dict["admin.uploadingPages"] || "Uploading pages"} (0/${files.length})...`
    );
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        const uploaded = await uploadImage(fd);
        urls.push(uploaded);
        toast.loading(
          `${dict["admin.uploadingPages"] || "Uploading pages"} (${i + 1}/${files.length})...`,
          { id: toastId }
        );
      }

      await addBookPages(bookId, urls, lang);
      setPages((prev) => [
        ...prev,
        ...urls.map((imageSrc, i) => ({ id: -(prev.length + i + 1), imageSrc })),
      ]);
      toast.success(dict["admin.pagesAdded"] || "Pages added.", { id: toastId });
      router.refresh();
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

  // --- Reorder / delete ---
  const persistOrder = (next: Page[]) => {
    setPages(next);
    startTransition(() => {
      reorderBookPages(
        bookId,
        next.filter((p) => p.id > 0).map((p) => p.id),
        lang
      )
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
    if (page.id < 0) return; // optimistic placeholder
    if (!window.confirm(dict["admin.deletePageConfirm"] || "Remove this page?"))
      return;

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

  const busy = uploading || addingUrl;

  return (
    <div className="space-y-6">
      {/* Add a page — paste a link OR upload from device */}
      <div className="overflow-hidden rounded-[28px] border-2 border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">
              {dict["admin.addPage"] || "Add a page"}
            </h2>
            <p className="text-xs text-slate-500">
              {dict["admin.addPageHint"] ||
                "Paste an image link or upload from your device."}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Paste a link */}
          <form onSubmit={addByUrl} className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Link2 className="h-3.5 w-3.5" />
              {dict["admin.pasteImageLink"] || "Paste image link"}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…/page.jpg"
                className="flex-1"
                disabled={busy}
              />
              <Button type="submit" variant="primary" disabled={busy || !url.trim()}>
                {addingUrl ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  dict["common.add"] || "Add"
                )}
              </Button>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              {dict["admin.pasteFromSearchHint"] ||
                "Tip: use the assistant's Image Search, copy a URL, and paste it here."}
            </p>
          </form>

          {/* divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {dict["common.or"] || "or"}
            </span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Upload from device */}
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            ) : (
              <Upload className="h-6 w-6 text-slate-400" />
            )}
            <span className="text-sm font-bold text-slate-600">
              {dict["admin.uploadPages"] || "Upload pages"}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {dict["admin.uploadPagesHint"] || "PNG, JPG or WEBP — select one or more."}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={busy}
            />
          </label>
        </div>
      </div>

      {/* Pages list */}
      <div>
        <div className="mb-3 flex items-center gap-2 px-1">
          <h2 className="font-bold text-slate-800">
            {dict["admin.bookPages"] || "Pages"}
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
            {pages.length}
          </span>
        </div>

        {pages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <ImagePlus className="h-10 w-10 text-slate-300" />
            {dict["admin.noPagesYet"] ||
              "No pages yet. Add a link or upload images to build the book."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="group overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm transition-colors hover:border-indigo-100"
              >
                <div className="relative aspect-[3/4] w-full bg-slate-50">
                  <Image
                    src={page.imageSrc}
                    alt={`${dict["admin.page"] || "Page"} ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-bold text-white">
                    <GripVertical className="h-3 w-3" />
                    {index + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                      onClick={() => move(index, -1)}
                      disabled={pending || index === 0}
                      title={dict["admin.moveUp"] || "Move up"}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                      onClick={() => move(index, 1)}
                      disabled={pending || index === pages.length - 1}
                      title={dict["admin.moveDown"] || "Move down"}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                    onClick={() => onDelete(page)}
                    disabled={pending}
                    title={dict["common.delete"] || "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

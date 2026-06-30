"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Trash2, ArrowUp, ArrowDown, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
        const url = await uploadImage(fd);
        urls.push(url);
        toast.loading(
          `${dict["admin.uploadingPages"] || "Uploading pages"} (${i + 1}/${files.length})...`,
          { id: toastId }
        );
      }

      await addBookPages(bookId, urls, lang);
      toast.success(dict["admin.pagesAdded"] || "Pages added.", { id: toastId });
      router.refresh();
      // Optimistically append so the UI updates before the refresh resolves.
      setPages((prev) => [
        ...prev,
        ...urls.map((imageSrc, i) => ({ id: -(prev.length + i + 1), imageSrc })),
      ]);
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
    if (page.id < 0) return; // optimistic placeholder, ignore
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-[24px] border-2 border-slate-100 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-bold text-slate-800">
            {dict["admin.bookPages"] || "Pages"}{" "}
            <span className="text-slate-400">({pages.length})</span>
          </h2>
          <p className="text-sm text-slate-500">
            {dict["admin.bookPagesHint"] ||
              "Upload page images in order. You can reorder or remove them below."}
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {dict["admin.uploadPages"] || "Upload pages"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <ImagePlus className="h-10 w-10 text-slate-300" />
          {dict["admin.noPagesYet"] || "No pages yet. Upload images to build the book."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="group relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm"
            >
              <div className="relative aspect-[3/4] w-full bg-slate-50">
                <Image
                  src={page.imageSrc}
                  alt={`${dict["admin.page"] || "Page"} ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-bold text-white">
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
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                    onClick={() => move(index, 1)}
                    disabled={pending || index === pages.length - 1}
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

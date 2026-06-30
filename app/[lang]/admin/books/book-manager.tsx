"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Images,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBook, updateBook, deleteBook, type BookInput } from "@/actions/book";
import { uploadImage } from "@/actions/lesson-block";
import type { AdminBook } from "@/db/queries";
import { useDictionary } from "@/app/[lang]/lang-provider";

const empty: BookInput = {
  title: "",
  coverSrc: "/edu-logo.png",
  description: "",
  category: "General",
  language: "en",
  isPublished: false,
};

export const BookManager = ({
  books,
  lang,
}: {
  books: AdminBook[];
  lang: string;
}) => {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BookInput>(empty);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (book: AdminBook) => {
    setEditingId(book.id);
    setForm({
      title: book.title,
      coverSrc: book.coverSrc,
      description: book.description,
      category: book.category,
      language: book.language,
      isPublished: book.isPublished,
    });
    setOpen(true);
  };

  const set = <K extends keyof BookInput>(key: K, value: BookInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading(dict["admin.uploadingImage"] || "Uploading...");
    try {
      const url = await uploadImage(formData);
      set("coverSrc", url);
      toast.success(dict["admin.imageUploaded"] || "Image uploaded!", {
        id: toastId,
      });
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
        ? updateBook(editingId, form, lang)
        : createBook(form, lang);

      action
        .then(() => {
          toast.success(
            editingId
              ? dict["admin.bookUpdated"] || "Book updated."
              : dict["admin.bookCreated"] || "Book created."
          );
          setOpen(false);
          router.refresh();
        })
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  const onDelete = (book: AdminBook) => {
    if (
      !window.confirm(
        `${dict["admin.deletePrefix"] || "Delete"} "${book.title}"? ${
          dict["admin.deleteBookConfirm"] || "This removes the book and its pages."
        }`
      )
    )
      return;

    startTransition(() => {
      deleteBook(book.id, lang)
        .then(() => {
          toast.success(dict["admin.bookDeleted"] || "Book deleted.");
          router.refresh();
        })
        .catch(() =>
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.")
        );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={openCreate} disabled={pending}>
          <Plus className="mr-1 h-5 w-5" />{" "}
          {dict["admin.createBook"] || "Create Book"}
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="rounded-[32px] border-2 border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
          {dict["admin.noBooks"] || "No books yet. Create your first one!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex gap-4 rounded-[24px] border-2 border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-100"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-100">
                <Image
                  src={book.coverSrc}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-800">{book.title}</h3>
                    <p className="text-xs text-slate-500">
                      {book.category} · {book.language.toUpperCase()}
                    </p>
                    {book.isPublished ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                        <Eye className="h-3 w-3" />
                        {dict["admin.published"] || "Published"}
                      </span>
                    ) : (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        <EyeOff className="h-3 w-3" />
                        {dict["admin.draft"] || "Draft"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                      onClick={() => openEdit(book)}
                      disabled={pending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                      onClick={() => onDelete(book)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {book.description ||
                    dict["admin.noDescription"] ||
                    "No description."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                    <Images className="h-3.5 w-3.5" /> {book.pages}{" "}
                    {dict["admin.pages"] || "pages"}
                  </span>
                  <Link
                    href={`/${lang}/admin/books/${book.id}`}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Images className="h-3.5 w-3.5" />{" "}
                    {dict["admin.managePages"] || "Pages"}
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
              {editingId
                ? dict["admin.editBook"] || "Edit book"
                : dict["admin.createBookTitle"] || "Create book"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">{dict["admin.fieldTitle"] || "Title"}</Label>
              <Input
                id="title"
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={dict["admin.bookTitlePlaceholder"] || "e.g. The Lost Star"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">
                  {dict["admin.fieldCategory"] || "Category"}
                </Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder={dict["admin.categoryPlaceholder"] || "e.g. Stories"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">
                  {dict["admin.fieldLanguage"] || "Language"}
                </Label>
                <select
                  id="language"
                  value={form.language}
                  onChange={(e) => set("language", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="km">ខ្មែរ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coverSrc">
                {dict["admin.coverImage"] || "Cover image"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="coverSrc"
                  value={form.coverSrc}
                  onChange={(e) => set("coverSrc", e.target.value)}
                  placeholder="/edu-logo.png"
                  className="flex-1"
                />
                <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100">
                  <Upload className="h-3.5 w-3.5" />
                  {dict["common.upload"] || "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                {dict["admin.fieldDescription"] || "Description"}
              </Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={dict["admin.bookDescPlaceholder"] || "What is this book about?"}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border-2 border-slate-100 p-3">
              <div>
                <div className="font-bold text-slate-700">
                  {dict["admin.published"] || "Published"}
                </div>
                <p className="text-xs text-slate-500">
                  {dict["admin.publishedHint"] || "Visible to kids in the library."}
                </p>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => set("isPublished", v)}
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
              <Button type="submit" variant="primary" disabled={pending || uploading}>
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

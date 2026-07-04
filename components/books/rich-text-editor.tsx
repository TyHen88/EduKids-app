"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Unlink,
  ImageIcon,
  Upload,
  Table as TableIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { uploadImage } from "@/actions/lesson-block";

type Props = {
  initialContent: string;
  onChange: (html: string) => void;
};

const Btn = ({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40",
      active && "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
    )}
  >
    {children}
  </button>
);

const Divider = () => <span className="mx-0.5 h-5 w-px bg-slate-200" />;

const Toolbar = ({ editor }: { editor: Editor }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    const html = editor.getHTML();
    if (!html || html === "<p></p>") return;

    setIsEnhancing(true);
    const toastId = toast.loading("Enhancing text with AI...");
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: html, isHtml: true }),
      });

      if (!res.ok) throw new Error("Failed to enhance text");

      const data = await res.json();
      if (data.text) {
        editor.commands.setContent(data.text);
        toast.success("Text enhanced successfully!", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to enhance text", { id: toastId });
    } finally {
      setIsEnhancing(false);
    }
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const addImageByUrl = () => {
    const url = window.prompt("Image URL (e.g. from Image Search)", "https://");
    if (!url || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const u = await uploadImage(fd);
      editor.chain().focus().setImage({ src: u }).run();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/70 px-2 py-1.5">
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn onClick={setLink} active={editor.isActive("link")} title="Link">
        <Link2 className="h-4 w-4" />
      </Btn>
      {editor.isActive("link") && (
        <Btn
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove link"
        >
          <Unlink className="h-4 w-4" />
        </Btn>
      )}

      <Divider />

      <Btn onClick={addImageByUrl} title="Insert image by URL">
        <ImageIcon className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Upload image"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Btn>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUploadFile}
      />

      <Divider />

      <Btn
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Insert table"
      >
        <TableIcon className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn
        onClick={handleEnhance}
        disabled={isEnhancing}
        title="Enhance text with AI"
      >
        {isEnhancing ? (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        ) : (
          <Sparkles className="h-4 w-4 text-indigo-500" />
        )}
      </Btn>
    </div>
  );
};

export const RichTextEditor = ({ initialContent, onChange }: Props) => {
  const editor = useEditor({
    immediatelyRender: false, // required under Next.js SSR
    extensions: [
      StarterKit.configure({ link: false }), // we add our own Link below
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "book-prose min-h-[300px] w-full px-4 py-3 focus:outline-none",
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white focus-within:border-indigo-300">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

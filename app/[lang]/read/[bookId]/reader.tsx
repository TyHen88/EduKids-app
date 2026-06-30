"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  List,
  BookOpen,
  ScrollText,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Unit = { id: number; title: string; content: string };
type Mode = "unit" | "full";

type Labels = {
  unit: string;
  of: string;
  prev: string;
  next: string;
  exit: string;
  theEnd: string;
  backToLibrary: string;
  contents: string;
  byUnit: string;
  readFull: string;
  finish: string;
};

export const Reader = ({
  lang,
  title,
  units,
  labels,
}: {
  lang: string;
  title: string;
  units: Unit[];
  labels: Labels;
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("unit");
  const [index, setIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const scrollRef = useRef<HTMLDivElement>(null);

  const go = (next: number) => {
    if (next < 0 || next >= units.length) return;
    setIndex(next);
  };

  // Arrow keys (unit mode) + Esc to exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(`/${lang}/books`);
      if (mode !== "unit") return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode]);

  // Jump to a unit from the sidebar (scrolls in full mode, selects in unit mode).
  const onPickUnit = (i: number) => {
    setSidebarOpen(false);
    if (mode === "full") {
      document
        .getElementById(`bk-unit-${units[i].id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setIndex(i);
      scrollRef.current?.scrollTo({ top: 0 });
    }
  };

  const Sidebar = (
    <nav className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <List className="h-4 w-4 text-indigo-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {labels.contents}
        </h2>
        <span className="ml-auto text-xs font-bold text-slate-400">
          {units.length}
        </span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {units.map((u, i) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onPickUnit(i)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border-2 px-2 py-2 text-left transition-colors",
              mode === "unit" && i === index
                ? "border-indigo-200 bg-indigo-50"
                : "border-transparent hover:bg-slate-100"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                mode === "unit" && i === index
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "truncate text-sm font-bold",
                mode === "unit" && i === index
                  ? "text-indigo-700"
                  : "text-slate-700",
                !u.title && "italic text-slate-400"
              )}
            >
              {u.title || `${labels.unit} ${i + 1}`}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );

  const current = units[index];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label={labels.contents}
          >
            <List className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-black text-slate-800 sm:text-base">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("unit")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                mode === "unit"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.byUnit}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("full")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                mode === "full"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.readFull}</span>
            </button>
          </div>

          <Link
            href={`/${lang}/books`}
            aria-label={labels.exit}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Body: sidebar + content (same layout as the admin editor) */}
      <div className="relative flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-3 lg:block">
          {Sidebar}
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <>
            <div
              className="absolute inset-0 z-20 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white p-3 shadow-xl lg:hidden">
              {Sidebar}
            </aside>
          </>
        )}

        {/* Content */}
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
            {mode === "unit" ? (
              <>
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-400">
                  {labels.unit} {index + 1} {labels.of} {units.length}
                </div>
                {current.title && (
                  <h2 className="mb-5 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
                    {current.title}
                  </h2>
                )}
                {current.content && (
                  <div
                    className="book-prose"
                    // Admin-authored (trusted) Tiptap HTML.
                    dangerouslySetInnerHTML={{ __html: current.content }}
                  />
                )}

                {/* Unit navigation */}
                <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => go(index - 1)}
                    disabled={index === 0}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" /> {labels.prev}
                  </button>
                  {index < units.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => go(index + 1)}
                      className="flex items-center gap-1.5 rounded-xl border-b-4 border-indigo-800 bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 active:border-b-0"
                    >
                      {labels.next} <ChevronRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <Link
                      href={`/${lang}/books`}
                      className="flex items-center gap-1.5 rounded-xl border-b-4 border-emerald-700 bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 active:border-b-0"
                    >
                      <CheckCircle2 className="h-5 w-5" /> {labels.finish}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              // Read full — every unit in one continuous scroll.
              <div className="space-y-10">
                {units.map((u, i) => (
                  <section key={u.id} id={`bk-unit-${u.id}`} className="scroll-mt-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-400">
                      {labels.unit} {i + 1}
                    </div>
                    {u.title && (
                      <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
                        {u.title}
                      </h2>
                    )}
                    {u.content && (
                      <div
                        className="book-prose"
                        dangerouslySetInnerHTML={{ __html: u.content }}
                      />
                    )}
                    {i < units.length - 1 && (
                      <div className="mt-8 h-px bg-slate-100" />
                    )}
                  </section>
                ))}
                <div className="flex justify-center pt-2">
                  <Link
                    href={`/${lang}/books`}
                    className="flex items-center gap-1.5 rounded-xl border-b-4 border-emerald-700 bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 active:border-b-0"
                  >
                    <CheckCircle2 className="h-5 w-5" /> {labels.finish}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

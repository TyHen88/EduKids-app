"use client";

import { useState } from "react";
import {
  Brain,
  Bot,
  ImageIcon,
  Search,
  Copy,
  ExternalLink,
  ArrowLeft,
  Loader2,
  X,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { searchImages, type ImageResult } from "@/actions/tools";
import { useDictionary } from "@/app/[lang]/lang-provider";

type View = "home" | "image";

// Colorful "AI brain" gradient, applied to the lucide Brain icon via an SVG
// linearGradient (referenced by id). Sider-style launcher.
const GradientDefs = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true">
    <defs>
      <linearGradient id="tools-brain-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="35%" stopColor="#ec4899" />
        <stop offset="70%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
  </svg>
);

export const ToolsAssist = () => {
  const dict = useDictionary();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [view, setView] = useState<View>("home");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await searchImages(q);
      setResults(res);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : dict["common.somethingWentWrong"] || "Something went wrong."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(dict["tools.urlCopied"] || "Image URL copied!");
    } catch {
      toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
    }
  };

  return (
    <>
      <GradientDefs />

      {/* Sider-style launcher: a white pill docked to the right edge with a
          gradient brain icon; hover reveals a × to dismiss it for now. */}
      {!dismissed && (
        <div className="group fixed right-3 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={dict["tools.hide"] || "Hide"}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/90 text-slate-500 opacity-0 shadow transition-opacity hover:bg-slate-300 hover:text-slate-700 group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={dict["tools.title"] || "Assistant tools"}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-400/20 transition-transform hover:scale-105 active:scale-95"
          >
            <Brain
              className="h-7 w-7"
              stroke="url(#tools-brain-grad)"
              strokeWidth={2.25}
            />
          </button>
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setView("home");
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-slate-100 p-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
              {view === "image" && (
                <button
                  type="button"
                  onClick={() => setView("home")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={dict["common.back"] || "Back"}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Brain
                className="h-5 w-5"
                stroke="url(#tools-brain-grad)"
                strokeWidth={2.25}
              />
              {view === "image"
                ? dict["tools.imageSearch"] || "Image Search"
                : dict["tools.title"] || "Assistant Tools"}
            </SheetTitle>
          </SheetHeader>

          {view === "home" ? (
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {/* Gemini AI — planned/disabled */}
              <div className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 opacity-70">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700">
                      {dict["tools.aiTitle"] || "AI Assistant"}
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      {dict["tools.planned"] || "Soon"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {dict["tools.aiDesc"] ||
                      "Ask Gemini for general info (coming soon)."}
                  </p>
                </div>
              </div>

              {/* Image search — active */}
              <button
                type="button"
                onClick={() => setView("image")}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">
                    {dict["tools.imageSearch"] || "Image Search"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {dict["tools.imageDesc"] ||
                      "Find images on the web and copy a URL."}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-5">
              <form onSubmit={runSearch} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    dict["tools.imagePlaceholder"] || "Search for an image..."
                  }
                  className="flex-1"
                />
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </Button>
              </form>

              <div className="-mx-1 mt-4 flex-1 overflow-y-auto px-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-12 text-center text-sm font-medium text-slate-400">
                    {searched
                      ? dict["tools.noResults"] || "No images found."
                      : dict["tools.searchHint"] ||
                        "Type a query and press search."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {results.map((img, i) => (
                      <div
                        key={`${img.imageUrl}-${i}`}
                        className="group/img relative overflow-hidden rounded-xl border-2 border-slate-100 bg-slate-50"
                      >
                        {/* External images from many domains — use a plain <img>
                            rather than next/image (no remotePatterns needed). */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.thumbnailUrl}
                          alt={img.title}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover/img:opacity-100">
                          <button
                            type="button"
                            onClick={() => copyUrl(img.imageUrl)}
                            title={dict["tools.copyUrl"] || "Copy image URL"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 hover:bg-white"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          {img.link && (
                            <a
                              href={img.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={dict["tools.openSource"] || "Open source"}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 hover:bg-white"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Lightbulb className="h-3.5 w-3.5" />
                {dict["tools.copyTip"] ||
                  "Tip: copy an image URL and paste it into a cover or page field."}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

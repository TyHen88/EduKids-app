"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain,
  Bot,
  ImageIcon,
  Search,
  Copy,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Lightbulb,
  PictureInPicture2,
  Minimize2,
  GripHorizontal,
  ChevronDown,
  X,
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

type View = "home" | "image" | "ai";
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

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
  const [view, setView] = useState<View>("home");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const idRef = useRef(0);

  // Floating launcher speed-dial: the brain toggles two icon buttons (AI +
  // Image); clicking one opens that tool's drawer directly (no home menu).
  const [menuOpen, setMenuOpen] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);

  const openTool = (kind: "ai" | "image") => {
    setMenuOpen(false);
    setView(kind);
    setOpen(true);
  };

  // Close the speed-dial when clicking/tapping anywhere outside the launcher.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (launcherRef.current && !launcherRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  // Pop-out: detach a tool (AI chat or Image search) into a floating,
  // draggable window. `null` means nothing is popped out.
  const [poppedOut, setPoppedOut] = useState<null | "ai" | "image">(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Pop the current tool out of the drawer into the floating window.
  const popOut = (kind: "ai" | "image") => {
    setPoppedOut(kind);
    setOpen(false);
  };

  // Dock the floating window back into the drawer (to the tool it came from).
  const dockIn = () => {
    const kind = poppedOut;
    setPoppedOut(null);
    if (kind) setView(kind);
    setOpen(true);
  };

  // The message-list scroll container. A *callback* ref (not a ref object) that
  // ignores null so it always points at the mounted instance — the drawer and
  // the pop-out window share renderChatBody(), and a plain ref object would get
  // nulled when the drawer unmounts, breaking the jump-to-latest button.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const setScrollEl = useCallback((node: HTMLDivElement | null) => {
    if (node) scrollRef.current = node;
  }, []);
  const atBottomRef = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Track whether the message list is scrolled near the bottom, so we only
  // auto-follow new messages when the user hasn't scrolled up to read history.
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = nearBottom;
    setShowScrollDown(!nearBottom);
  };

  // Scroll the message container itself (not scrollIntoView) so it also works
  // inside the dragged pop-out window, whose CSS transform breaks scrollIntoView.
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (!atBottomRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Send a message and stream the plain-text reply from /api/chat.
  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${idRef.current++}`,
      role: "user",
      content,
    };
    const assistantId = `a-${idRef.current++}`;
    const history = [...messages, userMsg];
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
      // Drop the empty assistant placeholder if nothing streamed in.
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    setNoMore(false);
    setActiveQuery(q);
    setPage(1);
    try {
      const res = await searchImages(q, 1);
      setResults(res);
      if (res.length === 0) setNoMore(true);
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

  // Load the next serper page and append any new images (dedup by URL).
  const loadMore = async () => {
    if (!activeQuery || moreLoading) return;
    const next = page + 1;
    setMoreLoading(true);
    try {
      const res = await searchImages(activeQuery, next);
      const seen = new Set(results.map((r) => r.imageUrl));
      const fresh = res.filter((r) => !seen.has(r.imageUrl));
      if (fresh.length === 0) {
        setNoMore(true);
      } else {
        setResults((prev) => [...prev, ...fresh]);
        setPage(next);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : dict["common.somethingWentWrong"] || "Something went wrong."
      );
    } finally {
      setMoreLoading(false);
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

  // The AI chat body (message list + input). Shared by the drawer's AI view
  // and the floating pop-out window so state persists when moving between them.
  const renderChatBody = () => (
    <>
      <div className="relative min-h-0 flex-1">
      <div
        ref={setScrollEl}
        onScroll={handleScroll}
        className="h-full overflow-y-auto pr-2 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="py-12 text-center text-sm font-medium text-slate-400">
            <div className="mb-6">
              {(dict as any)["tools.aiPlaceholder"] || "Hello! How can I help you today?"}
            </div>
            <div className="mx-auto flex max-w-[200px] flex-col gap-2">
              <Button
                variant="primaryOutline"
                size="sm"
                onClick={() => sendMessage("Help me write a course for beginners.")}
                className="w-full justify-start text-xs font-medium"
              >
                💡 Write a course
              </Button>
              <Button
                variant="primaryOutline"
                size="sm"
                onClick={() => sendMessage("Generate a quiz for animals.")}
                className="w-full justify-start text-xs font-medium"
              >
                💡 Generate a quiz
              </Button>
              <Button
                variant="primaryOutline"
                size="sm"
                onClick={() => sendMessage("Create a challenge for new users.")}
                className="w-full justify-start text-xs font-medium"
              >
                💡 Create a challenge
              </Button>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <div className={m.role === "user" ? "whitespace-pre-wrap" : "prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-pre:p-0"}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 text-slate-500">
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
            </div>
          </div>
        )}
      </div>

        {/* Jump-to-latest arrow — shown while scrolled up. */}
        {showScrollDown && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label={dict["tools.scrollToBottom"] || "Scroll to latest"}
            title={dict["tools.scrollToBottom"] || "Scroll to latest"}
            className="absolute bottom-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md shadow-slate-400/30 transition-transform hover:scale-105 hover:text-indigo-600 active:scale-95"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={(dict as any)["tools.aiInputPlaceholder"] || "Type a message..."}
          className="flex-1"
        />
        <Button type="submit" variant="primary" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </form>
    </>
  );

  // The image-search body (form + results grid + tip). Shared by the drawer's
  // image view and the floating pop-out window.
  const renderImageBody = () => (
    <>
      <form onSubmit={runSearch} className="flex items-center gap-2">
        <Input
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
          <>
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

          {!noMore && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="primaryOutline"
                onClick={loadMore}
                disabled={moreLoading}
              >
                {moreLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="mr-2 h-4 w-4" />
                )}
                {dict["tools.moreImages"] || "More images"}
              </Button>
            </div>
          )}
          </>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <Lightbulb className="h-3.5 w-3.5" />
        {dict["tools.copyTip"] ||
          "Tip: copy an image URL and paste it into a cover or page field."}
      </p>
    </>
  );

  return (
    <>
      <GradientDefs />

      {/* Sider-style launcher: a white brain pill docked to the right edge that
          fans out two floating tool buttons (AI + Image) when tapped. */}
      <div
        ref={launcherRef}
        className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-3"
      >
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                key="tool-ai"
                type="button"
                onClick={() => openTool("ai")}
                title={dict["tools.aiTitle"] || "AI Assistant"}
                aria-label={dict["tools.aiTitle"] || "AI Assistant"}
                initial={{ opacity: 0, y: 12, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.5 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                whileHover={{ scale: 1.15, rotate: -6 }}
                whileTap={{ scale: 0.85 }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-lg shadow-slate-400/20"
              >
                <Bot className="h-6 w-6" />
              </motion.button>
              <motion.button
                key="tool-image"
                type="button"
                onClick={() => openTool("image")}
                title={dict["tools.imageSearch"] || "Image Search"}
                aria-label={dict["tools.imageSearch"] || "Image Search"}
                initial={{ opacity: 0, y: 12, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                whileHover={{ scale: 1.15, rotate: 6 }}
                whileTap={{ scale: 0.85 }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-600 shadow-lg shadow-slate-400/20"
              >
                <ImageIcon className="h-6 w-6" />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={dict["tools.title"] || "Assistant tools"}
          aria-expanded={menuOpen}
          animate={{ rotate: menuOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-400/20"
        >
          <Brain
            className="h-7 w-7"
            stroke="url(#tools-brain-grad)"
            strokeWidth={2.25}
          />
        </motion.button>
      </div>

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
              {view !== "home" && (
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
                : view === "ai"
                ? dict["tools.aiTitle"] || "AI Assistant"
                : dict["tools.title"] || "Assistant Tools"}

              {(view === "ai" || view === "image") && (
                <button
                  type="button"
                  onClick={() => popOut(view)}
                  title={dict["tools.popOut"] || "Pop out"}
                  aria-label={dict["tools.popOut"] || "Pop out"}
                  className="ml-auto mr-7 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                >
                  <PictureInPicture2 className="h-5 w-5" />
                </button>
              )}
            </SheetTitle>
          </SheetHeader>

          {view === "home" ? (
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {/* AI Assistant */}
              <button
                type="button"
                onClick={() => setView("ai")}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">
                    {dict["tools.aiTitle"] || "AI Assistant"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {dict["tools.aiDesc"] ||
                      "Ask the AI assistant for general info and tips."}
                  </p>
                </div>
              </button>

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
          ) : view === "ai" ? (
            <div className="flex min-h-0 flex-1 flex-col p-5">
              {renderChatBody()}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-5">
              {renderImageBody()}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Pop-out: a floating, draggable window for the AI chat or image search.
          Drag it by the header (works with mouse and touch). Viewport-bound. */}
      {poppedOut && (
        <div
          ref={constraintsRef}
          className="pointer-events-none fixed inset-0 z-50"
        >
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0.06}
            className="pointer-events-auto absolute bottom-4 right-4 flex h-[70vh] max-h-[560px] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-500/30"
          >
            {/* Drag handle / header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex cursor-grab touch-none select-none items-center gap-2 border-b border-slate-100 bg-white p-3 active:cursor-grabbing"
            >
              <GripHorizontal className="h-4 w-4 shrink-0 text-slate-300" />
              {poppedOut === "image" ? (
                <ImageIcon className="h-5 w-5 shrink-0 text-indigo-600" />
              ) : (
                <Brain
                  className="h-5 w-5 shrink-0"
                  stroke="url(#tools-brain-grad)"
                  strokeWidth={2.25}
                />
              )}
              <span className="flex-1 truncate text-sm font-bold text-slate-800">
                {poppedOut === "image"
                  ? dict["tools.imageSearch"] || "Image Search"
                  : dict["tools.aiTitle"] || "AI Assistant"}
              </span>
              <button
                type="button"
                onClick={dockIn}
                title={dict["tools.dockIn"] || "Dock back"}
                aria-label={dict["tools.dockIn"] || "Dock back"}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPoppedOut(null)}
                title={dict["tools.close"] || "Close"}
                aria-label={dict["tools.close"] || "Close"}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col p-4">
              {poppedOut === "image" ? renderImageBody() : renderChatBody()}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

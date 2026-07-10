"use client";

import { useState, useRef, useEffect } from "react";
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <>
      <GradientDefs />

      {/* Sider-style launcher: a white pill docked to the right edge with a
          gradient brain icon. */}
      <div className="fixed right-3 top-1/2 z-40 -translate-y-1/2">
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
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
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
                <div ref={messagesEndRef} />
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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

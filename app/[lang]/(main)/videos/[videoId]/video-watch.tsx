"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Search, Crosshair, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";
import type { VideoDetails, TranscriptSegment } from "@/lib/youtube";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  lang: string;
  videoId: string;
  details: VideoDetails | null;
  transcript: TranscriptSegment[];
};

// Load the YouTube IFrame API once and resolve when YT.Player is available.
let ytReady: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytReady) return ytReady;

  ytReady = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    // Safety: if the callback was already fired before we hooked it.
    const poll = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(poll);
        resolve();
      }
    }, 200);
  });
  return ytReady;
}

const fmt = (s: number) => {
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const VideoWatch = ({ lang, videoId, details, transcript }: Props) => {
  const dict = useDictionary() as Record<string, string>;
  const t = (key: string, fallback: string) => dict[key] || fallback;

  const playerRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const [ready, setReady] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [follow, setFollow] = useState(true);
  const [filter, setFilter] = useState("");

  const hasTranscript = transcript.length > 0;

  // Create the player.
  useEffect(() => {
    let cancelled = false;
    loadYT().then(() => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onReady: () => setReady(true) },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
    };
  }, [videoId]);

  // Poll current time and highlight the active transcript line.
  useEffect(() => {
    if (!ready || !hasTranscript) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const now = p.getCurrentTime();
      // Find last segment whose start <= now.
      let idx = -1;
      for (let i = 0; i < transcript.length; i++) {
        if (transcript[i].start <= now) idx = i;
        else break;
      }
      setActiveIdx((prev) => (prev === idx ? prev : idx));
    }, 400);
    return () => clearInterval(id);
  }, [ready, hasTranscript, transcript]);

  // Auto-scroll the active line into view within the transcript panel.
  useEffect(() => {
    if (!follow || filter || activeIdx < 0) return;
    const el = activeRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    list.scrollTo({
      top: el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2,
      behavior: "smooth",
    });
  }, [activeIdx, follow, filter]);

  const seekTo = (start: number) => {
    const p = playerRef.current;
    if (!p?.seekTo) return;
    p.seekTo(Math.max(0, start), true);
    p.playVideo?.();
  };

  const copy = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(okMsg);
    } catch {
      toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
    }
  };

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return transcript
      .map((seg, i) => ({ seg, i }))
      .filter(({ seg }) => !q || seg.text.toLowerCase().includes(q));
  }, [transcript, filter]);

  const title = details?.title || t("videos.title", "Video");

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <Link
        href={`/${lang}/videos`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("videos.backToVideos", "Back to videos")}
      </Link>

      {/* Player + captions */}
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
            <div className="relative aspect-video w-full">
              {/* YT API replaces this node with the iframe. */}
              <div ref={mountRef} className="absolute inset-0 h-full w-full" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Live caption strip — the current line, right under the video */}
          {hasTranscript && (
            <div className="mt-3 flex min-h-[3.5rem] items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 px-4 py-3 text-center">
              {activeIdx >= 0 ? (
                <p className="text-base font-semibold leading-snug text-slate-800 sm:text-lg">
                  {transcript[activeIdx].text}
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-400">
                  {t(
                    "videos.captionsHint",
                    "Captions appear here as the video plays."
                  )}
                </p>
              )}
            </div>
          )}

          <h1 className="mt-4 text-lg font-black tracking-tight text-slate-800 sm:text-xl">
            {title}
          </h1>
          {details?.channelTitle && (
            <p className="mt-1 text-sm font-bold text-slate-500">
              {details.channelTitle}
            </p>
          )}
          {details?.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-500 line-clamp-6">
              {details.description}
            </p>
          )}
        </div>

      {/* Transcript — full-width component under the video */}
      <section className="mx-auto mt-8 flex max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-3">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <FileText className="h-4 w-4 text-indigo-600" />
              {t("videos.transcript", "Transcript")}
            </div>
            {hasTranscript && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFollow((v) => !v)}
                  title={t("videos.followAlong", "Follow along")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    follow
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-400 hover:bg-slate-100"
                  )}
                >
                  <Crosshair className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    copy(
                      transcript.map((s) => s.text).join(" "),
                      t("videos.copiedAll", "Transcript copied!")
                    )
                  }
                  title={t("videos.copyAll", "Copy all")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {!hasTranscript ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm font-medium text-slate-400">
              {t(
                "videos.noTranscript",
                "No transcript is available for this video."
              )}
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t("videos.searchTranscript", "Search transcript…")}
                    className="h-9 pl-9 text-sm"
                  />
                </div>
              </div>

              <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 sm:p-3">
                {shown.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-400">
                    {t("videos.noMatches", "No matching lines.")}
                  </p>
                ) : (
                  shown.map(({ seg, i }) => {
                    const isActive = i === activeIdx && !filter;
                    return (
                      <button
                        key={i}
                        ref={isActive ? activeRef : undefined}
                        type="button"
                        onClick={() => seekTo(seg.start)}
                        className={cn(
                          "group relative flex w-full items-start gap-3 rounded-lg py-2 pl-3 pr-2 text-left transition-colors",
                          isActive
                            ? "bg-indigo-50/70"
                            : "hover:bg-slate-50"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-indigo-500" />
                        )}
                        <span
                          className={cn(
                            "w-9 shrink-0 pt-0.5 font-mono text-[11px] font-semibold tabular-nums transition-colors",
                            isActive
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-indigo-400"
                          )}
                        >
                          {fmt(seg.start)}
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-[15px] leading-relaxed transition-colors",
                            isActive
                              ? "font-medium text-slate-900"
                              : "text-slate-600 group-hover:text-slate-800"
                          )}
                        >
                          {seg.text}
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(seg.text, t("videos.copiedLine", "Copied!"));
                          }}
                          title={t("common.copy", "Copy")}
                          className="mt-0.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 group-hover:flex"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
      </section>
    </div>
  );
};

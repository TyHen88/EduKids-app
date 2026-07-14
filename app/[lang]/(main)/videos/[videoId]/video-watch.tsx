"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Copy, Search, FileText, Loader2, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAudio, useWindowSize } from "react-use";
import Confetti from "react-confetti";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";
import type { VideoDetails, TranscriptSegment } from "@/lib/youtube";
import { awardVideoPoints } from "@/actions/videos";

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
  const { width, height } = useWindowSize();

  const playerRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const [ready, setReady] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [follow, setFollow] = useState(true);
  const [filter, setFilter] = useState("");

  // Tab control states: 'quiz' | 'transcript'
  const [activeTab, setActiveTab] = useState<"quiz" | "transcript">("quiz");

  // Quick check quiz states
  const [claimed, setClaimed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<"none" | "correct" | "wrong">("none");
  const [pending, startTransition] = useTransition();

  const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });
  const [incorrectAudio, _i, incorrectControls] = useAudio({ src: "/incorrect.wav" });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isClaimed = localStorage.getItem(`video_quiz_completed_${videoId}`) === "true";
      setClaimed(isClaimed);
    }
  }, [videoId]);

  const hasTranscript = transcript.length > 0;

  // Create the player.
  useEffect(() => {
    let cancelled = false;
    loadYT().then(() => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: { 
          rel: 0, 
          modestbranding: 1, 
          playsinline: 1,
          iv_load_policy: 3, // Hide video annotations
          controls: 1 // Keep standard controls
        },
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
    if (!follow || filter || activeIdx < 0 || activeTab !== "transcript") return;
    const el = activeRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    list.scrollTo({
      top: el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2,
      background: "smooth",
    } as any);
  }, [activeIdx, follow, filter, activeTab]);

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

  // Dynamically select or generate a child-friendly quiz based on video details
  const activeQuiz = useMemo(() => {
    // Generate a stable hash from videoId to determine question type
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
      hash += videoId.charCodeAt(i);
    }
    const qType = hash % 2;

    const isKhmer = lang === "km";

    // Dynamic distractors depending on language
    const titleDistractors = isKhmer 
      ? ["លេងហ្គេមពេញមួយថ្ងៃ", "គេងលក់ក្រោមពន្លឺផ្កាយ", "ដើរលេងក្នុងព្រៃ"]
      : ["Playing games all day", "Sleeping under the stars", "Walking in the forest"];
      
    const channelDistractors = isKhmer
      ? ["ប៉ុស្តិ៍ហ្គេមអវកាស", "កម្មវិធីកម្សាន្តប្រចាំថ្ងៃ", "តុក្កតាលេងសើច"]
      : ["Space Gamers Channel", "Daily Fun Show", "Mascot Playtime"];

    if (qType === 0 && details?.channelTitle) {
      // Question: Which channel created this video?
      const question = isKhmer 
        ? `តើប៉ុស្តិ៍យូធូប (YouTube) មួយណាជាអ្នកបង្កើតវីដេអូនេះ?`
        : `Which channel created this video?`;
      
      const choices = [
        { text: details.channelTitle, correct: true },
        { text: channelDistractors[0], correct: false },
        { text: channelDistractors[1], correct: false },
        { text: channelDistractors[2], correct: false },
      ].filter((item, index, self) => 
        self.findIndex(t => t.text === item.text) === index // unique check
      );

      // Stable shuffle based on hash
      const shuffled = [...choices].sort((a, b) => {
        const hashA = a.text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hashB = b.text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hashA + hash) % 3 - (hashB + hash) % 3;
      });

      return { question, choices: shuffled };
    } else {
      // Question: What is the topic of this video?
      const question = isKhmer
        ? `តើវីដេអូនេះនិយាយអំពីអ្វី?`
        : `What is the topic of this video?`;
      
      // Clean title for display in button
      const cleanTitle = title.split("|")[0].split("-")[0].trim();

      const choices = [
        { text: cleanTitle, correct: true },
        { text: titleDistractors[0], correct: false },
        { text: titleDistractors[1], correct: false },
        { text: titleDistractors[2], correct: false },
      ].filter((item, index, self) => 
        self.findIndex(t => t.text === item.text) === index // unique check
      );

      // Stable shuffle based on hash
      const shuffled = [...choices].sort((a, b) => {
        const hashA = a.text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hashB = b.text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hashA + hash) % 3 - (hashB + hash) % 3;
      });

      return { question, choices: shuffled };
    }
  }, [details, lang, videoId, title]);

  const handleAnswerSubmit = (optionIdx: number) => {
    if (claimed || quizStatus === "correct" || pending) return;

    setSelectedOption(optionIdx);
    const selected = activeQuiz.choices[optionIdx];

    if (selected.correct) {
      void correctControls.play();
      setQuizStatus("correct");
      
      startTransition(async () => {
        try {
          await awardVideoPoints();
          localStorage.setItem(`video_quiz_completed_${videoId}`, "true");
          setClaimed(true);
          toast.success(lang === "km" ? "អស្ចារ្យណាស់! អ្នកទទួលបាន ១០ ផ្កាយ Stardust! 🌟" : "Amazing! You earned 10 Stardust! 🌟");
        } catch (err) {
          console.error("Failed to award points:", err);
          toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
        }
      });
    } else {
      void incorrectControls.play();
      setQuizStatus("wrong");
      toast.error(lang === "km" ? "មិនទាន់ត្រឹមត្រូវទេ! ព្យាយាមម្ដងទៀត! 🚀" : "Not quite! Try again! 🚀");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      {correctAudio}
      {incorrectAudio}
      
      {quizStatus === "correct" && (
        <Confetti
          recycle={false}
          numberOfPieces={400}
          tweenDuration={8_000}
          width={width}
          height={height}
        />
      )}

      {/* Back navigation styled as chunky tactile button */}
      <Link
        href={`/${lang}/videos`}
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border-b-4 border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 active:translate-y-1 active:border-b-0 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("videos.backToVideos", "Back to videos")}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Spaceship Viewport + Title */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-[32px] border-4 border-slate-200 bg-white shadow-xl">
            {/* Spaceship Viewer Header */}
            <div className="flex items-center justify-between bg-slate-50/50 px-4 py-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400 animate-pulse"></span>
                <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                {lang === "km" ? "កម្មវិធីទស្សនាអវកាស" : "Cosmic Viewport"}
              </div>
              <div className="w-12"></div> {/* spacer for centering */}
            </div>

            {/* Video Content */}
            <div className="bg-slate-900 p-2">
              <div className="overflow-hidden rounded-2xl aspect-video w-full relative">
                {/* YT API replaces this node with the iframe. */}
                <div ref={mountRef} className="absolute inset-0 h-full w-full" />
                {!ready && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/70">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title & Channel details */}
          <div className="rounded-[32px] border-4 border-slate-200 bg-white p-6 shadow-xl">
            <h1 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl leading-snug">
              {title}
            </h1>
            {details?.channelTitle && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-black text-indigo-600 shadow-sm border border-indigo-100">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                {details.channelTitle}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Gamified Quiz & Transcript Panel */}
        <div className="space-y-6">
          <div className="rounded-[32px] border-4 border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col min-h-[480px]">
            {/* Spaceship Tabbed Selector Bar (only shown if video has a transcript) */}
            {hasTranscript && (
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                    activeTab === "quiz"
                      ? "bg-white border-2 border-indigo-500 text-indigo-600 shadow-sm"
                      : "border-2 border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Star className="h-4 w-4 fill-current" />
                  {t("videos.challengeTab", "Quiz Challenge")}
                </button>
                
                <button
                  onClick={() => setActiveTab("transcript")}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                    activeTab === "transcript"
                      ? "bg-white border-2 border-indigo-500 text-indigo-600 shadow-sm"
                      : "border-2 border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  {t("videos.transcriptTab", "Lyrics / Subtitles")}
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              {(!hasTranscript || activeTab === "quiz") ? (
                // ── Tab 1: Quiz Challenge ───────────────────────────────────
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  {/* Dialog bubble with Cosmo Buddy */}
                  <div className="flex items-start gap-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm relative">
                    <div className="relative h-12 w-12 shrink-0">
                      <Image
                        src="/edu-logo.png"
                        alt="Cosmo"
                        fill
                        className="object-contain rounded-[10px]"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">
                        {lang === "km" ? "មិត្តភក្តិ Cosmo" : "Cosmo Buddy"}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-slate-700 leading-relaxed">
                        {claimed
                          ? (lang === "km" ? "«អស្ចារ្យណាស់! អ្នកធ្វើបានល្អណាស់! តោះរៀនវីដេអូផ្សេងទៀត!»" : "“Incredible job! You answered correctly. Let's watch more videos!”")
                          : (lang === "km" ? "«ជួយឆ្លើយសំណួរល្បងប្រាជ្ញារបស់ខ្ញុំ ដើម្បីទទួលបាន Stardust ផ្កាយអវកាសណា! 🚀»" : "“Answer my check-in quiz correctly to claim your Stardust rewards! 🚀”")}
                      </p>
                    </div>
                  </div>

                  {/* Quiz Details */}
                  <div className="flex-1 flex flex-col justify-center py-4">
                    {claimed ? (
                      // Correct/Claimed screen
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <div className="rounded-full bg-emerald-100 p-3.5 text-emerald-600 mb-3.5 shadow-inner">
                          <CheckCircle2 className="h-9 w-9" />
                        </div>
                        <h4 className="text-base font-black text-slate-800">{t("videos.quizCorrectTitle", "Amazing! 🎉")}</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1.5">{t("videos.quizCorrectMessage", "You earned +10 Stardust and +15 Buddy XP! 🌟")}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-4 bg-slate-100 px-3 py-1 rounded-full">
                          {t("videos.quizKeepLearning", "Keep watching and learning!")}
                        </p>
                      </div>
                    ) : (
                      // Interactive options
                      <div className="space-y-4">
                        <p className="text-[15px] font-black text-slate-700 leading-relaxed border-l-4 border-indigo-400 pl-3">
                          {activeQuiz.question}
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {activeQuiz.choices.map((choice, index) => {
                            const isSelected = selectedOption === index;
                            const isCorrect = choice.correct;
                            
                            return (
                              <button
                                key={index}
                                disabled={pending}
                                onClick={() => handleAnswerSubmit(index)}
                                className={cn(
                                  "w-full rounded-2xl p-3.5 text-left text-sm font-black transition-all border-2 border-b-4 duration-150 active:translate-y-0.5 active:border-b-2",
                                  isSelected
                                    ? isCorrect
                                      ? "bg-emerald-500 border-emerald-600 text-white"
                                      : "bg-rose-500 border-rose-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{choice.text}</span>
                                  {isSelected && (
                                    <span className="text-[10px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded">
                                      {isCorrect ? "✓" : "✗"}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {quizStatus === "wrong" && (
                          <div className="rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                            <span>🚀</span>
                            {t("videos.quizWrongMessage", "No worries! Try again, you can do it!")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // ── Tab 2: Synced Subtitles / Transcript ─────────────────────
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {!hasTranscript ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-xs font-bold text-slate-400 gap-3 my-auto">
                      <div className="relative h-14 w-14 opacity-35">
                        <Image
                          src="/mascot_sad.svg"
                          alt="No transcript"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p>{t("videos.noTranscript", "No transcript is available for this video.")}</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          placeholder={t("videos.searchTranscript", "Search transcript…")}
                          className="h-9 pl-9 text-xs rounded-xl"
                        />
                      </div>

                      <div ref={listRef} className="flex-1 overflow-y-auto max-h-[360px] pr-1">
                        {shown.length === 0 ? (
                          <p className="p-6 text-center text-xs font-bold text-slate-400">
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
                                  "group relative flex w-full items-start gap-2.5 rounded-xl py-2 pl-3 pr-2 text-left transition-colors mb-1",
                                  isActive
                                    ? "bg-indigo-50/70"
                                    : "hover:bg-slate-50"
                                )}
                              >
                                {isActive && (
                                  <span className="absolute left-0.5 top-2 bottom-2 w-0.5 rounded-full bg-indigo-500" />
                                )}
                                <span
                                  className={cn(
                                    "w-8 shrink-0 pt-0.5 font-mono text-[10px] font-bold tracking-tight tabular-nums transition-colors",
                                    isActive
                                      ? "text-indigo-600"
                                      : "text-slate-400 group-hover:text-indigo-400"
                                  )}
                                >
                                  {fmt(seg.start)}
                                </span>
                                <span
                                  className={cn(
                                    "flex-1 text-[13px] leading-relaxed transition-colors font-semibold",
                                    isActive
                                      ? "text-indigo-950 font-bold"
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
                                  className="mt-0.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 group-hover:flex"
                                >
                                  <Copy className="h-3 w-3" />
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

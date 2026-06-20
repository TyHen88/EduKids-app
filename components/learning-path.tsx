"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  FileQuestion,
  BookOpen,
  Star,
} from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type PathNode = {
  id: number;
  title: string;
  type: "lesson" | "quiz" | "exam";
  status: "locked" | "unlocked" | "completed";
  href: string | null;
};

type LearningPathProps = {
  nodes: PathNode[];
  courseTitle: string;
};

export const LearningPath = ({ nodes, courseTitle }: LearningPathProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getIcon = (type: string, status: string) => {
    if (status === "locked") return <Lock className="h-6 w-6" />;
    if (type === "quiz" || type === "exam")
      return <FileQuestion className="h-6 w-6" />;
    if (type === "lesson") return <BookOpen className="h-6 w-6" />;
    return <Circle className="h-6 w-6" />;
  };

  const rowHeight = 160;
  const startY = 100;
  const endY = 100;
  const totalHeight = Math.max(0, (nodes.length - 1) * rowHeight) + startY + endY;
  const nodeXOffset = 60; // wavy offset left/right

  const getPathData = (isCompletedPath: boolean) => {
    const unlockedIndex = nodes.findIndex((p) => p.status === "unlocked");
    const targetIndex = isCompletedPath
      ? unlockedIndex === -1
        ? nodes.length - 1
        : unlockedIndex
      : nodes.length - 1;

    if (targetIndex < 0) return "";

    return nodes
      .slice(0, targetIndex + 1)
      .map((_, i) => {
        const y = i * rowHeight + startY;
        const x = 100 + (i % 2 === 0 ? nodeXOffset : -nodeXOffset);

        if (i === 0) return `M ${x} ${y}`;

        const prevY = (i - 1) * rowHeight + startY;
        const prevX = 100 + ((i - 1) % 2 === 0 ? nodeXOffset : -nodeXOffset);
        const cpY1 = prevY + rowHeight / 2;
        const cpY2 = y - rowHeight / 2;

        return `C ${prevX} ${cpY1}, ${x} ${cpY2}, ${x} ${y}`;
      })
      .join(" ");
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const unlockedIndex = nodes.findIndex((p) => p.status === "unlocked");
      if (unlockedIndex !== -1) {
        // Wait for render so offsetTop is correct
        setTimeout(() => {
          if (!scrollContainerRef.current) return;
          const yPos = unlockedIndex * rowHeight + startY;
          const containerOffset = scrollContainerRef.current.offsetTop;
          window.scrollTo({
            top: Math.max(0, containerOffset + yPos - window.innerHeight / 2),
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [nodes, rowHeight, startY]);

  return (
    <div className="mx-auto mt-4 max-w-4xl overflow-hidden px-2 pb-12 sm:px-6">
      <div className="mb-10 shrink-0 pt-4 text-center">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-800">
          Star Journey 🚀
        </h1>
        <p className="text-lg font-medium text-slate-500">
          Travel the stars through {courseTitle}!
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative mx-auto w-full max-w-3xl"
      >
        <div
          className="relative mx-auto w-full"
          style={{ height: `${totalHeight}px` }}
        >
          {/* Wavy SVG line */}
          <div
            className="pointer-events-none absolute bottom-0 left-1/2 top-0 -translate-x-1/2"
            style={{ width: "200px" }}
          >
            <svg
              className="h-full w-full"
              viewBox={`0 0 200 ${totalHeight}`}
              preserveAspectRatio="none"
            >
              <path
                d={getPathData(false)}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
                strokeDasharray="16 16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={getPathData(true)}
                fill="none"
                stroke="#6366f1"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Nodes and cards */}
          {nodes.map((node, i) => {
            const isEven = i % 2 === 0;
            const xOffset = isEven ? nodeXOffset : -nodeXOffset;
            const y = i * rowHeight + startY;
            const isCompleted = node.status === "completed";
            const isUnlocked = node.status === "unlocked";
            const isLocked = node.status === "locked";

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={cn(
                  "absolute flex w-full items-center justify-between",
                  isEven ? "flex-row-reverse" : "flex-row"
                )}
                style={{ top: y - 70, height: "140px" }}
              >
                <div className="w-1/2" />

                {/* Node visual */}
                <div
                  className="absolute left-1/2 top-1/2 z-20 flex shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ marginLeft: `${xOffset}px` }}
                >
                  <div
                    className={cn(
                      "relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 bg-white shadow-md transition-transform hover:scale-110",
                      isCompleted &&
                        "border-white bg-emerald-500 text-white shadow-lg",
                      isUnlocked &&
                        "animate-pulse scale-110 border-4 border-white bg-indigo-600 text-white shadow-xl ring-4 ring-indigo-100",
                      isLocked &&
                        "cursor-not-allowed border-white bg-slate-200 text-slate-400 opacity-80"
                    )}
                  >
                    {isUnlocked && (
                      <span className="absolute -right-3 -top-3 rounded-full bg-yellow-400 p-1 text-white">
                        <Star className="h-4 w-4 fill-current" />
                      </span>
                    )}
                    {getIcon(node.type, node.status)}
                  </div>
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "w-[calc(50%-45px)] sm:w-[calc(50%-70px)]",
                    isEven ? "text-right" : "text-left"
                  )}
                >
                  <div
                    className={cn(
                      "group relative w-full rounded-[24px] border-2 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md sm:p-5",
                      isCompleted && "border-emerald-100 bg-emerald-50",
                      isUnlocked &&
                        "scale-[1.02] border-indigo-200 bg-white shadow-xl ring-2 ring-indigo-50",
                      isLocked && "border-slate-100 bg-slate-50 opacity-80"
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 sm:block sm:h-4 sm:w-4",
                        isEven
                          ? "right-[-7px] border-r-2 border-t-2 sm:right-[-9px]"
                          : "left-[-7px] border-b-2 border-l-2 sm:left-[-9px]",
                        isCompleted
                          ? "border-emerald-100 bg-emerald-50"
                          : isUnlocked
                            ? "border-indigo-200 bg-white"
                            : "border-slate-100 bg-slate-50"
                      )}
                    />

                    <div className="relative z-10 flex h-full w-full flex-col justify-center">
                      <div
                        className={cn(
                          "mb-1 text-[8px] font-bold uppercase tracking-widest sm:mb-1.5 sm:text-[10px]",
                          isCompleted && "text-emerald-500",
                          isUnlocked && "text-indigo-500",
                          isLocked && "text-slate-400",
                          isEven ? "text-right" : "text-left"
                        )}
                      >
                        {node.type}
                      </div>

                      <h3
                        className={cn(
                          "mb-2 text-sm font-bold leading-tight sm:mb-3 sm:text-base",
                          isLocked ? "text-slate-400" : "text-slate-800",
                          isEven ? "text-right" : "text-left"
                        )}
                      >
                        {node.title}
                      </h3>

                      {isUnlocked && node.href && (
                        <Link
                          href={node.href}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-700 sm:py-2.5"
                        >
                          <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Start Now</span>
                          <span className="sm:hidden">Start</span>
                        </Link>
                      )}

                      {isCompleted && (
                        <div
                          className={cn(
                            "mt-1 hidden items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 sm:flex sm:justify-start sm:text-xs",
                            isEven ? "sm:justify-end" : "sm:justify-start"
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 sm:h-4 sm:w-4" />{" "}
                          Finished
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

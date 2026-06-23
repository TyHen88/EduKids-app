"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number; // 1-based current page
  pageCount: number; // total number of pages
  onPageChange: (page: number) => void;
  className?: string;
};

// Build a compact page list with ellipses, e.g. [1, "…", 4, 5, 6, "…", 12].
const buildPages = (page: number, pageCount: number): (number | "…")[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < pageCount - 1) pages.push("…");
  pages.push(pageCount);
  return pages;
};

export const Pagination = ({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) => {
  if (pageCount <= 1) return null;

  const pages = buildPages(page, pageCount);
  const go = (p: number) => onPageChange(Math.min(pageCount, Math.max(1, p)));

  const arrowCls =
    "flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500";

  return (
    <div
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={arrowCls}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1.5 text-sm font-bold text-slate-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-xl border-2 px-2 text-sm font-bold transition-colors",
              p === page
                ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                : "border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        className={arrowCls}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

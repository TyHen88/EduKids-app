"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Page = { id: number; imageSrc: string };

type Labels = {
  page: string;
  of: string;
  prev: string;
  next: string;
  exit: string;
  theEnd: string;
  backToLibrary: string;
};

export const Reader = ({
  lang,
  title,
  pages,
  labels,
}: {
  lang: string;
  title: string;
  pages: Page[];
  labels: Labels;
}) => {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  // `index === pages.length` shows the friendly "The End" screen.
  const atEnd = index === pages.length;

  const go = (next: number) => {
    if (next < 0 || next > pages.length) return;
    setIndex(next);
  };

  // Arrow-key navigation + Esc to exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") router.push(`/${lang}/books`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <h1 className="truncate text-sm font-bold sm:text-base">{title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white/70">
            {atEnd
              ? labels.theEnd
              : `${labels.page} ${index + 1} ${labels.of} ${pages.length}`}
          </span>
          <Link
            href={`/${lang}/books`}
            aria-label={labels.exit}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Page */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2">
        {atEnd ? (
          <div className="flex flex-col items-center gap-5 text-center text-white">
            <div className="text-3xl font-black sm:text-4xl">{labels.theEnd}</div>
            <Link
              href={`/${lang}/books`}
              className="rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-indigo-700 active:border-b-0"
            >
              {labels.backToLibrary}
            </Link>
          </div>
        ) : (
          <div className="relative h-full w-full max-w-3xl">
            <Image
              src={pages[index].imageSrc}
              alt={`${labels.page} ${index + 1}`}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* Prev / Next overlay buttons */}
        {index > 0 && (
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={labels.prev}
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {!atEnd && (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={labels.next}
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex shrink-0 items-center justify-center gap-1.5 pb-4">
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`${labels.page} ${i + 1}`}
            onClick={() => go(i)}
            className={
              "h-1.5 rounded-full transition-all " +
              (i === index ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50")
            }
          />
        ))}
      </div>
    </div>
  );
};

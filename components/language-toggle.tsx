"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  // The Khmer label is pinned to Battambang so it renders consistently even
  // when the active locale is "en" (the page body font is then Nunito, which
  // has no Khmer glyphs and would fall back to a random system font).
  {
    locale: "km",
    label: "ខ្មែរ",
    flag: "/kh.svg",
    alt: "Khmer",
    fontFamily: '"Battambang", sans-serif',
  },
  { locale: "en", label: "EN", flag: "/en.svg", alt: "English", fontFamily: undefined },
] as const;

export const LanguageToggle = () => {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/");
  const currentLocale = segments[1] === "en" ? "en" : "km";

  const switchLocale = (newLocale: "en" | "km") => {
    if (newLocale === currentLocale) return;

    const newSegments = [...segments];
    newSegments[1] = newLocale;
    router.push(newSegments.join("/"));
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const isActive = currentLocale === opt.locale;
        return (
          <button
            key={opt.locale}
            type="button"
            aria-pressed={isActive}
            onClick={() => switchLocale(opt.locale)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold transition-colors duration-200 sm:px-2.5",
              isActive
                ? "text-indigo-600"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="lang-toggle-pill"
                className="absolute inset-0 rounded-full border border-slate-100 bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Image
              src={opt.flag}
              alt={opt.alt}
              height={14}
              width={18}
              className={cn(
                "relative z-10 rounded-sm transition-opacity",
                isActive ? "opacity-100" : "opacity-60"
              )}
            />
            <span
              className="relative z-10 hidden lg:inline"
              style={opt.fontFamily ? { fontFamily: opt.fontFamily } : undefined}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

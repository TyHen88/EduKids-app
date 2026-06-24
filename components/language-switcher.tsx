"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";

const pathFor = (segments: string[], locale: "en" | "km") => {
  const next = [...segments];
  next[1] = locale;
  return next.join("/");
};

export const LanguageSwitcher = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const segments = pathname.split("/");
  const currentLocale = segments[1] === "en" ? "en" : "km";
  const otherLocale = currentLocale === "en" ? "km" : "en";

  // Prefetch the other locale's RSC payload so the swap is near-instant instead
  // of fetching the whole document tree on click (the main source of the flash).
  useEffect(() => {
    router.prefetch(pathFor(segments, otherLocale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const switchLocale = (newLocale: "en" | "km") => {
    if (newLocale === currentLocale) return;

    // startTransition keeps the current page rendered while the new locale
    // loads (no blank flash); replace avoids stacking a history entry per toggle.
    startTransition(() => {
      router.replace(pathFor(segments, newLocale), { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-x-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      <Button
        variant={currentLocale === "km" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => switchLocale("km")}
        className="h-8 gap-x-1.5 px-2.5 text-xs font-bold"
      >
        <Image
          src="/kh.svg"
          alt="Khmer"
          height={16}
          width={20}
          className="rounded-sm"
        />
        ខ្មែរ
      </Button>
      <Button
        variant={currentLocale === "en" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => switchLocale("en")}
        className="h-8 gap-x-1.5 px-2.5 text-xs font-bold"
      >
        <Image
          src="/en.svg"
          alt="English"
          height={16}
          width={20}
          className="rounded-sm"
        />
        EN
      </Button>
    </div>
  );
};

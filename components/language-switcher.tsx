"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/");
  const currentLocale = segments[1] === "en" ? "en" : "km";

  const switchLocale = (newLocale: "en" | "km") => {
    if (newLocale === currentLocale) return;

    const newSegments = [...segments];
    newSegments[1] = newLocale;
    const newPath = newSegments.join("/");

    router.push(newPath);
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

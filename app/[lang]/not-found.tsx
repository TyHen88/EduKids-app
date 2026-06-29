"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useDictionary, useLocale } from "./lang-provider";

// Rendered for unmatched URLs under `[lang]` and whenever `notFound()` is
// thrown in a route segment. It sits inside `[lang]/layout.tsx`, so the
// DictionaryProvider (and fonts/providers) are available here.
const NotFound = () => {
  const dict = useDictionary();
  const locale = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-[32px] border-2 border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-5xl font-extrabold tracking-tight text-indigo-600">
          404
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-800">
          {dict["notFound.title"] || "Page not found"}
        </h1>
        <p className="mt-3 text-base text-slate-500">
          {dict["notFound.message"] ||
            "Oops! We couldn't find the page you're looking for. It may have moved or no longer exists."}
        </p>
        <div className="mt-8">
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href={`/${locale}/learn`}>
              {dict["notFound.goHome"] || "Back to home"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useDictionary, useLocale } from "./lang-provider";

// Error boundary for the whole `[lang]` segment. Catches uncaught exceptions
// thrown while rendering its pages and shows a friendly fallback with a retry.
// (This version of Next.js passes `unstable_retry` instead of `reset`.)
const Error = ({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) => {
  const dict = useDictionary();
  const locale = useLocale();

  useEffect(() => {
    // Surface the error for debugging / future error-reporting hookup.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-[32px] border-2 border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
          {dict["error.title"] || "Oops! Something broke"}
        </h1>
        <p className="mt-3 text-base text-slate-500">
          {dict["error.message"] ||
            "We hit a little bump while loading this page. Let's try again!"}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => unstable_retry()}
          >
            {dict["error.retry"] || "Try again"}
          </Button>
          <Button asChild variant="primaryOutline" size="lg" className="w-full">
            <Link href={`/${locale}/learn`}>
              {dict["error.goHome"] || "Back to home"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Error;

"use client";

import { useEffect } from "react";

import "./globals.css";

// Last-resort boundary for errors thrown in the root `[lang]/layout.tsx`
// itself. It replaces the root layout, so it must render its own <html>/<body>
// and cannot rely on the DictionaryProvider — copy is kept neutral here.
// (This version of Next.js passes `unstable_retry` instead of `reset`.)
const GlobalError = ({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-[32px] border-2 border-slate-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              Something went wrong
            </h1>
            <p className="mt-3 text-base text-slate-500">
              An unexpected error occurred. Please try again.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border-b-4 border-indigo-800 bg-indigo-600 px-8 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-indigo-700 active:border-b-0"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;

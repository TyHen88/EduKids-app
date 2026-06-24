import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading fallbacks used by route `loading.tsx` files so navigation
 * shows an instant, layout-shaped placeholder instead of a blank/frozen screen.
 * Skeletons mirror the real page structure to avoid a jump when content swaps in.
 */

/** Simple branded spinner centered in the available space. */
export const CenteredSpinner = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
  </div>
);

/** Generic content skeleton: title, hero banner, and a card grid. Fits the
 *  student dashboard, backpack, achievements, admin, parent, and report pages. */
export const ContentSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>

    <Skeleton className="h-32 w-full rounded-3xl" />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-3xl" />
      ))}
    </div>
  </div>
);

/** Lesson player skeleton: top progress bar, question, answer options, footer. */
export const QuizSkeleton = () => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-4 px-4 pt-6 sm:px-6">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-4 flex-1 rounded-full" />
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>

    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-10">
      <Skeleton className="mx-auto h-8 w-3/4" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>

    <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
      <Skeleton className="ml-auto h-12 w-32 rounded-2xl" />
    </div>
  </div>
);

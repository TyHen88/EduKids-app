"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export const RefreshButton = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      <RefreshCw className={"h-3.5 w-3.5 " + (pending ? "animate-spin" : "")} />
      Refresh
    </button>
  );
};

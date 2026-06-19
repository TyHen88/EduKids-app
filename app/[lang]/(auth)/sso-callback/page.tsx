"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { useLocale } from "@/app/[lang]/lang-provider";

export default function SSOCallbackPage() {
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm font-bold">Signing you in…</p>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={`/${locale}/learn`}
        signUpForceRedirectUrl={`/${locale}/learn`}
        signInFallbackRedirectUrl={`/${locale}/learn`}
        signUpFallbackRedirectUrl={`/${locale}/learn`}
      />
    </div>
  );
}

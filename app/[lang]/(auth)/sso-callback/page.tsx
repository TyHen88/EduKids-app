"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function SSOCallbackPage() {
  const locale = useLocale();
  const dict = useDictionary();

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm font-bold">
        {dict["auth.signingYouIn"] || "Signing you in…"}
      </p>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={`/${locale}/learn`}
        signUpForceRedirectUrl={`/${locale}/learn`}
        signInFallbackRedirectUrl={`/${locale}/learn`}
        signUpFallbackRedirectUrl={`/${locale}/learn`}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authError } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export const GoogleButton = ({ label }: { label: string }) => {
  const locale = useLocale();
  const dict = useDictionary();
  const [loading, setLoading] = useState(false);

  // OAuth works for both new and returning users — Supabase creates the account
  // on first Google login. On success the browser is redirected to Google, so
  // onClick never returns; only an error path resets the spinner.
  const onClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const next = `/${locale}/learn`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Route handler that exchanges the code for a session, then redirects
          // to `next` (see app/[lang]/(auth)/sso-callback/route.ts).
          redirectTo: `${origin}/${locale}/sso-callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });

      if (error) {
        toast.error(
          authError(
            error,
            dict["auth.couldntSignInWithGoogle"] ||
              "Couldn't sign in with Google. Please try again."
          )
        );
        setLoading(false);
      }
    } catch (err) {
      toast.error(
        authError(
          err,
          dict["auth.couldntSignInWithGoogle"] ||
            "Couldn't sign in with Google. Please try again."
        )
      );
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 6.94L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75z"
          />
        </svg>
      )}
      {label}
    </button>
  );
};

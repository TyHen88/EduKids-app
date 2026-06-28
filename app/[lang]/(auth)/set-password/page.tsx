"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { acceptFamilyInvite } from "@/actions/family";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { authError } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function SetPasswordPage() {
  const locale = useLocale();
  const dict = useDictionary();

  // null = checking session, true = recovery session present, false = none.
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Manually parse the hash if it exists (bulletproof fallback for implicit grants)
    if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
      console.log("Found access_token in hash, setting session manually...");
      const params = new URLSearchParams(window.location.hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
          console.log("Manual setSession result:", { data, error });
          if (data.session) {
            setHasSession(true);
            // Optional: clean up the URL to hide the token
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } else {
            setHasSession(false);
          }
        });
        return; // Skip the rest, we are handling it manually
      }
    }

    // Normal session check for existing sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setHasSession(true);
      } else if (event === "INITIAL_SESSION") {
        setHasSession(false);
      }
    });

    const timer = setTimeout(() => {
      setHasSession((prev) => (prev === null ? false : prev));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(
          authError(
            updateError,
            dict["auth.couldntSetPassword"] || "Couldn't set your new password."
          )
        );
        setLoading(false);
        return;
      }

      if (data?.user?.id) {
        await acceptFamilyInvite(data.user.id);
      } else {
        await acceptFamilyInvite();
      }

      window.location.assign(`/${locale}/family`);
      return;
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.couldntSetPassword"] || "Couldn't set your new password."
        )
      );
      setLoading(false);
    }
  };

  const footer = (
    <Link
      href={`/${locale}/sign-in`}
      className="font-bold text-indigo-600 hover:underline"
    >
      {dict["auth.backToSignIn"] || "Back to sign in"}
    </Link>
  );

  // Still checking for the recovery session.
  if (hasSession === null) {
    return (
      <AuthShell
        title={dict["auth.setNewPassword"] || "Set a password"}
        subtitle=""
        footer={footer}
      >
        <div className="flex justify-center py-6 text-indigo-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthShell>
    );
  }

  // No recovery session → the link was invalid / expired / opened directly.
  if (!hasSession) {
    return (
      <AuthShell
        title={dict["auth.setNewPassword"] || "Set a password"}
        subtitle={
          dict["auth.invalidResetLink"] ||
          "This invite link is invalid or has expired."
        }
        footer={footer}
      >
        <Button asChild variant="primary" className="w-full" size="lg">
          <Link href={`/${locale}/sign-in`}>
            {dict["auth.backToSignIn"] || "Back to sign in"}
          </Link>
        </Button>
      </AuthShell>
    );
  }

  // Recovery session present → let them choose a new password.
  return (
    <AuthShell
      title={dict["auth.welcomeToFamily"] || "Welcome to the Family! 🎉"}
      subtitle={dict["auth.setInvitePassword"] || "You've been invited to join EduKids. Please set a password to activate your account and continue."}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="mb-2 flex justify-center text-indigo-500">
          <LockKeyhole className="h-10 w-10" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">
            {dict["auth.newPassword"] || "New password"}
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              dict["auth.atLeast8Characters"] || "At least 8 characters"
            }
            className={authInputClass}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            (dict as any)["auth.setPasswordAndContinue"] || "Set password & continue"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

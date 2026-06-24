"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { authError } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

/**
 * Where the password-reset email link lands (via sso-callback, which exchanges
 * the recovery code for a session first). With that recovery session active,
 * updateUser({ password }) is authorized. If there's no session — e.g. the link
 * expired or someone opened this URL directly — we show an "invalid link" state.
 */
export default function ResetPasswordPage() {
  const locale = useLocale();
  const dict = useDictionary();

  // null = checking session, true = recovery session present, false = none.
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
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

      window.location.assign(`/${locale}/learn`);
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
        title={dict["auth.resetTitle"] || "Reset your password 🔑"}
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
        title={dict["auth.resetTitle"] || "Reset your password 🔑"}
        subtitle={
          dict["auth.invalidResetLink"] ||
          "This reset link is invalid or has expired. Please request a new one."
        }
        footer={footer}
      >
        <Button asChild variant="primary" className="w-full" size="lg">
          <Link href={`/${locale}/forgot-password`}>
            {dict["auth.requestNewLink"] || "Request a new link"}
          </Link>
        </Button>
      </AuthShell>
    );
  }

  // Recovery session present → let them choose a new password.
  return (
    <AuthShell
      title={dict["auth.setNewPassword"] || "Set a new password"}
      subtitle={dict["auth.resetChoosePassword"] || "Choose a new password."}
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
            dict["auth.resetAndSignIn"] || "Reset & sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

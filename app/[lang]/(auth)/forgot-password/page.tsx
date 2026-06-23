"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { authError } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const dict = useDictionary();

  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // After clicking the email link, Supabase sends the user through sso-callback
  // (which exchanges the recovery code for a session) and then to the
  // reset-password page where they choose a new password. This URL must be in
  // Supabase's Auth → URL Configuration → Redirect URLs allowlist.
  const resetRedirectUrl = () =>
    `${window.location.origin}/${locale}/sso-callback?next=${encodeURIComponent(
      `/${locale}/reset-password`
    )}`;

  const sendLink = async () => {
    const supabase = createClient();
    // Sends a recovery email with {{ .ConfirmationURL }} (the link flow).
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl(),
    });
  };

  const onSendLink = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: sendError } = await sendLink();
      if (sendError) {
        setError(
          authError(
            sendError,
            dict["auth.couldntSendResetCode"] || "Couldn't send the reset link."
          )
        );
        setLoading(false);
        return;
      }

      setStep("sent");
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.couldntFindAccount"] || "Couldn't find that account."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    setResent(false);

    try {
      const { error: resendError } = await sendLink();
      if (resendError) {
        setError(
          authError(
            resendError,
            dict["auth.couldntSendResetCode"] || "Couldn't send the reset link."
          )
        );
      } else {
        setResent(true);
      }
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.couldntSendResetCode"] || "Couldn't send the reset link."
        )
      );
    } finally {
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

  if (step === "sent") {
    return (
      <AuthShell
        title={dict["auth.checkYourEmail"] || "Check your email 📬"}
        subtitle={
          dict["auth.resetLinkSentTo"]?.replace("{email}", email) ||
          `We sent a password reset link to ${email}.`
        }
        footer={footer}
      >
        <div className="space-y-5 text-center">
          <div className="flex justify-center text-indigo-500">
            <MailCheck className="h-12 w-12" />
          </div>

          <p className="text-sm font-medium text-slate-600">
            {dict["auth.clickLinkToReset"] ||
              "Open the email and click the link — it brings you right back here to set a new password. 🔑"}
          </p>

          {resent && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
              {dict["auth.linkResent"] ||
                "We've sent the link again — check your inbox."}
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={onResend}
            variant="primaryOutline"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              dict["auth.resendResetLink"] || "Resend reset link"
            )}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={dict["auth.resetTitle"] || "Reset your password 🔑"}
      subtitle={
        dict["auth.resetEmailLinkSubtitle"] ||
        "We'll email you a link to reset it."
      }
      footer={footer}
    >
      <form onSubmit={onSendLink} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{dict["auth.email"] || "Email"}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            dict["auth.sendResetLink"] || "Send reset link"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

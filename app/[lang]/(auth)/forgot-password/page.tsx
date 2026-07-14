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
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // Keep fallback redirect URL configuration if needed.
  const resetRedirectUrl = () =>
    `${window.location.origin}/${locale}/sso-callback?next=${encodeURIComponent(
      `/${locale}/reset-password`
    )}`;

  const sendOtp = async () => {
    const supabase = createClient();
    // Sends a recovery email containing the OTP code (rendered via {{ .Token }} in template).
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl(),
    });
  };

  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: sendError } = await sendOtp();
      if (sendError) {
        setError(
          authError(
            sendError,
            dict["auth.couldntSendResetCode"] || "Couldn't send the reset code."
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

  const onVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "recovery",
      });

      if (verifyError) {
        setError(
          authError(
            verifyError,
            dict["auth.codeDidntWork"] || "That code didn't work."
          )
        );
        setLoading(false);
        return;
      }

      // Successful verification automatically logs user in. Forward to reset password page!
      window.location.assign(`/${locale}/reset-password`);
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.codeDidntWork"] || "That code didn't work."
        )
      );
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    setResent(false);

    try {
      const { error: resendError } = await sendOtp();
      if (resendError) {
        setError(
          authError(
            resendError,
            dict["auth.couldntSendResetCode"] || "Couldn't send the reset code."
          )
        );
      } else {
        setResent(true);
      }
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.couldntSendResetCode"] || "Couldn't send the reset code."
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
          dict["auth.resetCodeSubtitle"]?.replace("{email}", email) ||
          `Enter the code we sent to ${email}.`
        }
        footer={footer}
      >
        <form onSubmit={onVerifyRecovery} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">
              {dict["auth.resetCode"] || "Reset code"}
            </Label>
            <Input
              id="code"
              type="text"
              required
              maxLength={8}
              pattern="\d{8}"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="12345678"
              className="text-center tracking-[0.25em] text-lg font-black"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 text-center">
              {error}
            </p>
          )}

          {resent && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 text-center">
              {dict["auth.linkResent"] || "We've sent the link again — check your inbox."}
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
              dict["auth.verifyCode"] || "Verify code"
            )}
          </Button>

          <Button
            type="button"
            onClick={onResend}
            variant="primaryOutline"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {dict["auth.resendResetLink"] || "Resend reset link"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={dict["auth.resetTitle"] || "Reset your password 🔑"}
      subtitle={
        dict["auth.resetEmailSubtitle"] ||
        "We'll email you a code to reset it."
      }
      footer={footer}
    >
      <form onSubmit={onSendOtp} className="space-y-4">
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
            dict["auth.sendResetCode"] || "Send reset code"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

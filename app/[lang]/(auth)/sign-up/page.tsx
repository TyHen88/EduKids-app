"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { authError } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function SignUpPage() {
  const locale = useLocale();
  const dict = useDictionary();

  const [step, setStep] = useState<"form" | "sent">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // Where Supabase sends the user after they click the confirmation link (kept as fallback redirect configuration).
  const confirmRedirectUrl = () =>
    `${window.location.origin}/${locale}/sso-callback?next=${encodeURIComponent(
      `/${locale}/learn`
    )}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: createError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: confirmRedirectUrl() },
      });
      if (createError) {
        setError(
          authError(
            createError,
            dict["auth.couldntCreateAccount"] || "Couldn't create your account."
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
          dict["auth.couldntCreateAccount"] || "Couldn't create your account."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "signup",
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

      // Session established inside PWA! Forward to learn page.
      window.location.assign(`/${locale}/learn`);
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
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: confirmRedirectUrl() },
      });
      if (resendError) {
        setError(
          authError(
            resendError,
            dict["auth.couldntCreateAccount"] || "Couldn't create your account."
          )
        );
      } else {
        setResent(true);
      }
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.couldntCreateAccount"] || "Couldn't create your account."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "sent") {
    return (
      <AuthShell
        title={dict["auth.checkYourEmail"] || "Check your email 📬"}
        subtitle={
          dict["auth.sentCodeTo"]?.replace("{email}", email) ||
          `We sent an 8-digit code to ${email}.`
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError("");
              setResent(false);
              setCode("");
            }}
            className="font-bold text-indigo-600 hover:underline"
          >
            {dict["auth.useDifferentEmail"] || "Use a different email"}
          </button>
        }
      >
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">
              {dict["auth.verificationCode"] || "Verification code"}
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
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
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
              dict["auth.verifyAndLaunch"] || "Verify & launch 🚀"
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
            {dict["auth.resendLink"] || "Resend confirmation link"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={dict["auth.signUpTitle"] || "Join the adventure! 🌟"}
      subtitle={
        dict["auth.signUpSubtitle"] || "Create an account to start exploring."
      }
      footer={
        <>
          {dict["auth.alreadyHaveAccount"] || "Already have an account?"}{" "}
          <Link
            href={`/${locale}/sign-in`}
            className="font-bold text-indigo-600 hover:underline"
          >
            {dict["auth.signIn"] || "Sign in"}
          </Link>
        </>
      }
    >
      <GoogleButton
        label={dict["auth.signUpWithGoogle"] || "Sign up with Google"}
      />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {dict["common.or"] || "or"}
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
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

        <div className="space-y-1.5">
          <Label htmlFor="password">
            {dict["auth.password"] || "Password"}
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
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
            dict["auth.createAccount"] || "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

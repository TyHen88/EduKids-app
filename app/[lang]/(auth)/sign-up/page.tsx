"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { clerkError } from "@/lib/clerk-error";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function SignUpPage() {
  const { signUp } = useSignUp();
  // Pin the resource instance that sent the email code for the verify step.
  const signUpRef = useRef(signUp);
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: createError } = await signUp.create({
        emailAddress: email,
        password,
      });
      if (createError) {
        setError(
          clerkError(
            createError,
            dict["auth.couldntCreateAccount"] || "Couldn't create your account."
          )
        );
        setLoading(false);
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(
          clerkError(
            sendError,
            dict["auth.couldntSendCode"] || "Couldn't send the code."
          )
        );
        setLoading(false);
        return;
      }

      signUpRef.current = signUp;
      setStep("verify");
    } catch (err) {
      setError(
        clerkError(
          err,
          dict["auth.couldntCreateAccount"] || "Couldn't create your account."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async (theCode: string) => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const su = signUpRef.current;

      const { error: verifyError } = await su.verifications.verifyEmailCode({
        code: theCode,
      });

      if (verifyError) {
        setError(
          clerkError(
            verifyError,
            dict["auth.codeDidntWork"] || "That code didn't work."
          )
        );
        setLoading(false);
        return;
      }

      await su.finalize({ navigate: () => router.push(`/${locale}/learn`) });
    } catch (err) {
      setError(
        clerkError(
          err,
          dict["auth.codeDidntWork"] || "That code didn't work."
        )
      );
      setLoading(false);
    }
  };

  const onCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) void verify(digits); // auto-verify on paste/complete
  };

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    void verify(code);
  };

  if (step === "verify") {
    return (
      <AuthShell
        title={dict["auth.checkYourEmail"] || "Check your email 📬"}
        subtitle={
          dict["auth.sentCodeTo"]?.replace("{email}", email) ||
          `We sent a 6-digit code to ${email}.`
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError("");
            }}
            className="font-bold text-indigo-600 hover:underline"
          >
            {dict["auth.useDifferentEmail"] || "Use a different email"}
          </button>
        }
      >
        <form onSubmit={onVerify} className="space-y-4">
          <div className="mb-2 flex justify-center text-indigo-500">
            <MailCheck className="h-10 w-10" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">
              {dict["auth.verificationCode"] || "Verification code"}
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="123456"
              className={`${authInputClass} text-center text-lg tracking-[0.3em]`}
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
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              dict["auth.verifyAndLaunch"] || "Verify & launch 🚀"
            )}
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
          <Input
            id="password"
            type="password"
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

        {/* Clerk bot-protection mounts here when enabled */}
        <div id="clerk-captcha" />

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

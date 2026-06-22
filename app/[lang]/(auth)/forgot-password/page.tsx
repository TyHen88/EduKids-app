"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Loader2, KeyRound, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { clerkError } from "@/lib/clerk-error";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  // Pin the exact resource instance that sent the code so the verify step's
  // "code sent" guard recognises it (Future/signals API quirk).
  const signInRef = useRef(signIn);
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();

  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: createError } = await signIn.create({ identifier: email });
      if (createError) {
        setError(
          clerkError(
            createError,
            dict["auth.couldntFindAccount"] || "Couldn't find that account."
          )
        );
        setLoading(false);
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(
          clerkError(
            sendError,
            dict["auth.couldntSendResetCode"] ||
              "Couldn't send the reset code."
          )
        );
        setLoading(false);
        return;
      }

      signInRef.current = signIn;
      setStep("code");
    } catch (err) {
      setError(
        clerkError(
          err,
          dict["auth.couldntFindAccount"] || "Couldn't find that account."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (theCode: string) => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { error: verifyError } =
        await signInRef.current.resetPasswordEmailCode.verifyCode({
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

      setStep("password");
      setLoading(false);
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
    if (digits.length === 6) void verifyResetCode(digits); // auto-verify
  };

  const onVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void verifyResetCode(code);
  };

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const si = signInRef.current;

      const { error: submitError } =
        await si.resetPasswordEmailCode.submitPassword({ password });
      if (submitError) {
        setError(
          clerkError(
            submitError,
            dict["auth.couldntSetPassword"] ||
              "Couldn't set your new password."
          )
        );
        setLoading(false);
        return;
      }

      await si.finalize({ navigate: () => router.push(`/${locale}/learn`) });
    } catch (err) {
      setError(
        clerkError(
          err,
          dict["auth.couldntSetPassword"] || "Couldn't set your new password."
        )
      );
      setLoading(false);
    }
  };

  const subtitle =
    step === "email"
      ? dict["auth.resetEmailSubtitle"] || "We'll email you a code to reset it."
      : step === "code"
        ? dict["auth.resetCodeSubtitle"]?.replace("{email}", email) ||
          `Enter the code we sent to ${email}.`
        : dict["auth.resetChoosePassword"] || "Choose a new password.";

  return (
    <AuthShell
      title={dict["auth.resetTitle"] || "Reset your password 🔑"}
      subtitle={subtitle}
      footer={
        <Link
          href={`/${locale}/sign-in`}
          className="font-bold text-indigo-600 hover:underline"
        >
          {dict["auth.backToSignIn"] || "Back to sign in"}
        </Link>
      }
    >
      {step === "email" && (
        <form onSubmit={onSendCode} className="space-y-4">
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
      )}

      {step === "code" && (
        <form onSubmit={onVerifySubmit} className="space-y-4">
          <div className="mb-2 flex justify-center text-indigo-500">
            <KeyRound className="h-10 w-10" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">
              {dict["auth.resetCode"] || "Reset code"}
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
              dict["auth.verifyCode"] || "Verify code"
            )}
          </Button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={onSetPassword} className="space-y-4">
          <div className="mb-2 flex justify-center text-indigo-500">
            <LockKeyhole className="h-10 w-10" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">
              {dict["auth.newPassword"] || "New password"}
            </Label>
            <Input
              id="password"
              type="password"
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
      )}
    </AuthShell>
  );
}

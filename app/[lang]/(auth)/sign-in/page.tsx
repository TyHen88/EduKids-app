"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { authError } from "@/lib/auth-error";
import { recordLogin } from "@/actions/audit";
import { WELCOME_TOAST_KEY } from "@/components/welcome-toast";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export default function SignInPage() {
  const locale = useLocale();
  const dict = useDictionary();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          authError(
            signInError,
            dict["auth.wrongEmailOrPassword"] || "Wrong email or password."
          )
        );
        setLoading(false);
        return;
      }

      await recordLogin("email");
      sessionStorage.setItem(WELCOME_TOAST_KEY, "1");
      window.location.assign(`/${locale}/learn`);
      return;
    } catch (err) {
      setError(
        authError(
          err,
          dict["auth.wrongEmailOrPassword"] || "Wrong email or password."
        )
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={dict["auth.signInTitle"] || "Welcome back, explorer! 🚀"}
      subtitle={
        dict["auth.signInSubtitle"] || "Sign in to continue your adventure."
      }
      footer={
        <>
          {dict["auth.newHere"] || "New here?"}{" "}
          <Link
            href={`/${locale}/sign-up`}
            className="font-bold text-indigo-600 hover:underline"
          >
            {dict["auth.createAnAccount"] || "Create an account"}
          </Link>
        </>
      }
    >
      <GoogleButton
        label={dict["auth.continueWithGoogle"] || "Continue with Google"}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              {dict["auth.password"] || "Password"}
            </Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              {dict["auth.forgot"] || "Forgot?"}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
            dict["auth.signIn"] || "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

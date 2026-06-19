"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { clerkError } from "@/lib/clerk-error";
import { useLocale } from "@/app/[lang]/lang-provider";

export default function SignInPage() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await signIn.password({
        identifier: email,
        password,
      });

      if (signInError) {
        setError(clerkError(signInError, "Wrong email or password."));
        setLoading(false);
        return;
      }

      await signIn.finalize({ navigate: () => router.push(`/${locale}/learn`) });
    } catch (err) {
      setError(clerkError(err, "Wrong email or password."));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back, explorer! 🚀"
      subtitle="Sign in to continue your adventure."
      footer={
        <>
          New here?{" "}
          <Link
            href={`/${locale}/sign-up`}
            className="font-bold text-indigo-600 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton label="Continue with Google" />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          or
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
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
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

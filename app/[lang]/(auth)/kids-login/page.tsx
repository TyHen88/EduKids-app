"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useLocale } from "@/app/[lang]/lang-provider";
import { hasUserProfile } from "@/actions/onboarding";

const KidsLoginPage = () => {
  const { signIn } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const locale = useLocale();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsLoading(true);

    try {
      const securePassword = `${pin}-EduKids-Secret-Pin-!`;
      
      const { error } = await signIn.create({
        identifier: username.includes("@") ? username : `${username}@dummy.edukids.com`,
        password: securePassword,
      });

      if (!error) {
        await signIn.finalize();

        // The Clerk user may exist (Clerk is shared across environments) while
        // this account has no profile in the currently configured database.
        // Don't drift such an "orphaned" login into the new-user onboarding —
        // reject it clearly instead.
        const profileExists = await hasUserProfile();
        if (!profileExists) {
          await signOut();
          toast.error(
            "This account isn't set up in this app. Please ask your parent to add you."
          );
          setIsLoading(false);
          return;
        }

        router.push(`/${locale}/learn`);
      } else {
        toast.error((error as any).errors?.[0]?.message || error.message || "Invalid username or PIN");
        setIsLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid username or PIN");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href={`/${locale}`} className="inline-block transition-transform hover:scale-105 active:scale-95">
            <div className="relative mx-auto mb-4 h-24 w-24">
              <Image
                src="/mascot.svg"
                alt="EduKids Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">
            Kids Login
          </h1>
          <p className="mt-2 text-lg font-bold text-slate-500">
            Welcome back!
          </p>
        </div>

        <form 
          onSubmit={handleLogin} 
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
        >
          <div className="space-y-2">
            <label className="block text-center text-sm font-bold uppercase tracking-wider text-slate-600">
              Username
            </label>
            <Input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sophia123"
              className="h-14 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 text-center text-lg font-bold text-slate-800 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-0 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-center text-sm font-bold uppercase tracking-wider text-slate-600">
              4-Digit PIN
            </label>
            <div className="flex justify-center">
              <InputOTP 
                maxLength={4} 
                value={pin} 
                onChange={(value) => setPin(value)}
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <InputOTPSlot 
                      key={index} 
                      index={index} 
                      className="h-16 w-16 rounded-xl border-2 border-slate-200 bg-slate-50 text-2xl font-black text-slate-800 transition-colors focus:border-slate-400 focus:bg-white" 
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading || !signIn}
              variant="primary"
              className="h-14 w-full text-lg"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="flex items-center">
                  Sign In <PlayCircle className="ml-2 h-6 w-6" />
                </span>
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link
              href={`/${locale}`}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to Main Page
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KidsLoginPage;

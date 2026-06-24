"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";
import { hasUserProfile } from "@/actions/onboarding";
import { recordLogin } from "@/actions/audit";
import { WELCOME_TOAST_KEY } from "@/components/welcome-toast";

const KidsLoginPage = () => {
  const locale = useLocale();
  const dict = useDictionary();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error(dict["auth.pinMustBe4Digits"] || "Oops! Your PIN needs 4 numbers 🔢");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const securePassword = `${pin}-EduKids-Secret-Pin-!`;
      const email = username.includes("@")
        ? username
        : `${username}@dummy.edukids.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: securePassword,
      });

      if (!error) {
        // The auth user may exist while this account has no profile in the
        // currently configured database. Don't drift such an "orphaned" login
        // into the new-user onboarding — reject it clearly instead.
        const profileExists = await hasUserProfile();
        if (!profileExists) {
          await supabase.auth.signOut();
          toast.error(
            dict["auth.accountNotSetUp"] ||
              "Hmm, we can't find your account. Ask your parent to add you! 👨‍👩‍👧"
          );
          setIsLoading(false);
          return;
        }

        await recordLogin("pin");

        // Show the welcome toast on the destination page — it survives the full
        // reload below via sessionStorage (a toast fired here would be wiped).
        sessionStorage.setItem(WELCOME_TOAST_KEY, "1");
        // Full navigation (not router.push) so the new session is picked up
        // cleanly by the server components and middleware on the next request.
        window.location.assign(`/${locale}/learn`);
        return;
      } else {
        toast.error(
          dict["auth.invalidUsernameOrPin"] ||
            "Oops! Wrong username or PIN. Try again! 🙈"
        );
        setIsLoading(false);
      }
    } catch (err: any) {
      toast.error(
        dict["auth.invalidUsernameOrPin"] ||
          "Oops! Something went wrong. Try again! 🙈"
      );
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={dict["auth.kidsLogin"] || "Kids Login"}
      subtitle={dict["auth.welcomeBack"] || "Welcome back, explorer!"}
      footer={
        <Link
          href={`/${locale}`}
          className="font-bold text-indigo-600 hover:underline"
        >
          ← {dict["auth.backToMainPage"] || "Back to Main Page"}
        </Link>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username">{dict["auth.username"] || "Username"}</Label>
          <Input
            id="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={dict["auth.usernamePlaceholder"] || "e.g. sophia123"}
            className={authInputClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{dict["auth.fourDigitPin"] || "4-Digit PIN"}</Label>
          <div className="flex justify-center pt-1">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={(value) => setPin(value)}
            >
              <InputOTPGroup className="gap-2.5">
                {[0, 1, 2, 3].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-12 w-12 rounded-2xl border-2 border-slate-200 text-lg font-black text-slate-800 transition-colors focus:border-indigo-500"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center">
              {dict["auth.signIn"] || "Sign In"}
              <PlayCircle className="ml-2 h-5 w-5" />
            </span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default KidsLoginPage;

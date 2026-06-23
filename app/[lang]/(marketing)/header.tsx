"use client";
import { useEffect, useState } from "react";

import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Banner from "@/components/banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/auth/user-menu";
import { useDictionary, useLocale } from "@/app/[lang]/lang-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Header = () => {
  const [hideBanner, setHideBanner] = useState(true);
  const dict = useDictionary();
  const locale = useLocale();
  // null = still loading, then boolean once we know the auth state.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setSignedIn(!!user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session?.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Banner hide={hideBanner} setHide={setHideBanner} />

      <header
        className={cn(
          "h-20 w-full border-b-2 border-slate-200 px-4",
          !hideBanner ? "mt-20 sm:mt-16 lg:mt-10" : "mt-0"
        )}
      >
        <div className="mx-auto flex h-full items-center justify-between lg:max-w-screen-lg">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-x-3 pb-7 pl-4 pt-8"
          >
            <Image src="/mascot.svg" alt="Mascot" height={40} width={40} />

            <h1 className="text-2xl font-extrabold tracking-wide text-indigo-600">
              EduKids
            </h1>
          </Link>

          <div className="flex items-center gap-x-3">
            <LanguageSwitcher />
            {signedIn === null ? (
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : signedIn ? (
              <UserMenu />
            ) : (
              <Button size="lg" variant="ghost" asChild>
                <Link href={`/${locale}/sign-in`}>
                  {dict["marketing.login"] || "Login"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

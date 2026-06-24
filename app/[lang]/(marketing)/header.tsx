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

// Module-scoped cache so the resolved auth state survives the client remount
// that happens on every locale switch (the [lang] route param changes). Without
// it, `signedIn` resets to null on each switch and the auth area flashes a
// spinner before settling back to the Login button / user menu.
let cachedSignedIn: boolean | null = null;

export const Header = () => {
  const [hideBanner, setHideBanner] = useState(true);
  const dict = useDictionary();
  const locale = useLocale();
  // null = still loading, then boolean once we know the auth state. Seeded from
  // the module cache so a locale switch starts from the last known value.
  const [signedIn, setSignedIn] = useState<boolean | null>(() => cachedSignedIn);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // getSession() reads the persisted session locally (no network round-trip),
    // so the state is known on the first tick instead of after a fetch.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      cachedSignedIn = !!session?.user;
      setSignedIn(cachedSignedIn);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      cachedSignedIn = !!session?.user;
      setSignedIn(cachedSignedIn);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* <Banner hide={hideBanner} setHide={setHideBanner} /> */}

      <header
        className={cn(
          "sticky h-20 mt-2 top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4 lg:max-w-screen-lg">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-x-2.5 transition-opacity hover:opacity-90"
          >
            <Image
              src="/mascot.svg"
              alt="EduKids mascot"
              height={40}
              width={40}
              priority
            />

            <h1 className="text-2xl font-extrabold tracking-tight text-indigo-600">
              EduKids
            </h1>
          </Link>

          <div className="flex items-center gap-x-2 sm:gap-x-3">
            <LanguageSwitcher />

            {/* Reserve width so the spinner → button/menu swap never shifts the layout. */}
            <div className="flex min-w-[88px] justify-end">
              {signedIn === null ? (
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : signedIn ? (
                <UserMenu />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="rounded-[15px] px-6 shadow-sm"
                >
                  <Link href={`/${locale}/sign-in`}>
                    {dict["marketing.login"] || "Login"}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

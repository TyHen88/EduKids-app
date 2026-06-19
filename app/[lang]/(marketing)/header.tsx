"use client";
import { useState } from "react";

import { ClerkLoaded, ClerkLoading, Show, UserButton } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Banner from "@/components/banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDictionary, useLocale } from "@/app/[lang]/lang-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Header = () => {
  const [hideBanner, setHideBanner] = useState(true);
  const dict = useDictionary();
  const locale = useLocale();

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
          <Link href="/" className="flex items-center gap-x-3 pb-7 pl-4 pt-8">
            <Image src="/mascot.svg" alt="Mascot" height={40} width={40} />

            <h1 className="text-2xl font-extrabold tracking-wide text-indigo-600">
              EduKids
            </h1>
          </Link>

          <div className="flex items-center gap-x-3">
            <LanguageSwitcher />
            <ClerkLoading>
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-in">
                <UserButton />
              </Show>

              <Show when="signed-out">
                <Button size="lg" variant="ghost" asChild>
                  <Link href={`/${locale}/sign-in`}>
                    {dict["marketing.login"] || "Login"}
                  </Link>
                </Button>
              </Show>
            </ClerkLoaded>
          </div>
        </div>
      </header>
    </>
  );
};

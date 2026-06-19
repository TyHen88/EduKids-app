"use client";
import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import Banner from "@/components/banner";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [hideBanner, setHideBanner] = useState(true);

  return (
    <>
      <Banner hide={hideBanner} setHide={setHideBanner} />

      <header
        className={cn(
          "h-20 w-full border-b-2 border-slate-200 px-4",
          !hideBanner ? "mt-20 sm:mt-16 lg:mt-10" : "mt-0"
        )}
      >
        <div className="mx-auto flex h-full items-center lg:max-w-screen-lg">
          <Link href="/" className="flex items-center gap-x-3 pl-4">
            <Image src="/mascot.svg" alt="Mascot" height={40} width={40} />
            <h1 className="text-2xl font-extrabold tracking-wide text-indigo-600">
              EduKids
            </h1>
          </Link>
        </div>
      </header>
    </>
  );
};

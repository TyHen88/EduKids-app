"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/app/[lang]/lang-provider";

export const Footer = () => {
  const dict = useDictionary();

  return (
    <div className="hidden h-20 w-full border-t-2 border-slate-200 p-2 lg:block">
      <div className="mx-auto flex h-full max-w-screen-lg items-center justify-evenly">
        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/kh.svg"
            alt="Khmer"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          {dict["marketing.khmer"] || "Khmer"}
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/en.svg"
            alt="English"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          {dict["marketing.english"] || "English"}
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/math.svg"
            alt="Math"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          {dict["marketing.math"] || "Math"}
        </Button>
      </div>
    </div>
  );
};

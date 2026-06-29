import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getDictionary, Locale } from "../dictionaries";

type Props = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function MarketingPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const { userId } = await auth();
  const signedIn = !!userId;

  return (
    <div className="mx-auto flex w-full max-w-[988px] flex-1 flex-col items-center justify-center gap-2 p-4 lg:flex-row">
      <div className="relative mb-8 h-[240px] w-[240px] lg:mb-0 lg:h-[424px] lg:w-[424px]">
        <Image src="/hero.svg" alt={dict["marketing.heroAlt"] || "Hero"} fill sizes="(min-width: 1024px) 424px, 240px" />
      </div>

      <div className="flex flex-col items-center gap-y-8">
        <h1 className="max-w-[480px] text-center text-xl font-bold text-slate-800 lg:text-3xl">
          {dict["marketing.title"]}
        </h1>

        <div className="flex w-full max-w-[330px] flex-col items-center gap-y-3">
          {signedIn ? (
            <Button size="lg" variant="secondary" className="w-full" asChild>
              <Link href={`/${lang}/learn`}>
                {dict["marketing.continueLearning"]}
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" variant="secondary" className="w-full" asChild>
                <Link href={`/${lang}/sign-up`}>
                  {dict["marketing.getStarted"]}
                </Link>
              </Button>

              <Button
                size="lg"
                variant="primaryOutline"
                className="w-full"
                asChild
              >
                <Link href={`/${lang}/sign-in`}>
                  {dict["marketing.alreadyAccount"]}
                </Link>
              </Button>

              <div className="flex w-full items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold uppercase text-slate-400">
                  {dict["common.or"] || "or"}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Button
                size="lg"
                variant="super"
                className="w-full text-indigo-50"
                asChild
              >
                <Link href={`/${lang}/kids-login`}>
                  {dict["auth.kidsLogin"] || "Kids Login"}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { ClerkProvider } from "@clerk/nextjs";
import { Nunito, Battambang } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config";

import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { Toaster } from "@/components/ui/sonner";

import { getDictionary, defaultLocale, locales } from "./dictionaries";
import { DictionaryProvider } from "./lang-provider";
import "../globals.css";

const nunito = Nunito({ subsets: ["latin"] });
const battambang = Battambang({ subsets: ["khmer"], weight: ["400", "700"] });

export const viewport: Viewport = { themeColor: "#D97706" };
export const metadata: Metadata = siteConfig;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as any);
  // km pages render in Battambang (self-hosted via next/font); en pages use Nunito.
  const fontClass = lang === "km" ? battambang.className : nunito.className;
  return (
    <ClerkProvider
      appearance={{
        layout: { logoImageUrl: "/favicon.ico" },
        variables: { colorPrimary: "#4f46e5" },
      }}
      signInUrl={`/${lang}/sign-in`}
      signUpUrl={`/${lang}/sign-up`}
      signInFallbackRedirectUrl={`/${lang}/learn`}
      signUpFallbackRedirectUrl={`/${lang}/learn`}
      afterSignOutUrl={`/${lang}`}
    >
      <html lang={lang}>
        <body className={fontClass}>
          <DictionaryProvider dictionary={dict} lang={lang as any}>
            <Toaster theme="light" richColors closeButton />
            <ExitModal />
            <HeartsModal />
            <PracticeModal />
            {children}
          </DictionaryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

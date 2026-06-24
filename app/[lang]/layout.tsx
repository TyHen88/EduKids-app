import { Nunito, Battambang } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config";

import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { Toaster } from "@/components/ui/sonner";
import { WelcomeToast } from "@/components/welcome-toast";

import { getDictionary, defaultLocale, locales } from "./dictionaries";
import { DictionaryProvider } from "./lang-provider";
import "../globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const battambang = Battambang({
  subsets: ["khmer"],
  weight: ["400", "700"],
  variable: "--font-battambang",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Required for env(safe-area-inset-*) to take effect (notch / home indicator)
  // when the app runs full-screen / added to the iPad/iPhone home screen.
  viewportFit: "cover",
};
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
  // Both fonts are exposed as CSS variables on <html>. The body font stack puts
  // Latin (Nunito) and Khmer (Battambang) in one chain so Khmer text always
  // renders in Battambang even on English pages (Nunito has no Khmer glyphs).
  const fontClass = lang === "km" ? "font-app-khmer" : "font-app-latin";
  return (
    <html lang={lang} className={`${nunito.variable} ${battambang.variable}`}>
      <body className={fontClass} suppressHydrationWarning>
        <DictionaryProvider dictionary={dict} lang={lang as any}>
          <Toaster />
          <WelcomeToast />
          <ExitModal />
          <HeartsModal />
          <PracticeModal />
          {children}
        </DictionaryProvider>
      </body>
    </html>
  );
}

import { Nunito, Battambang } from "next/font/google";
import type { Metadata, Viewport } from "next";
import {
  siteConfig,
  siteDescription,
  siteName,
  siteOgImage,
  siteTagline,
  siteUrl,
} from "@/config";

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
const OG_LOCALES: Record<string, string> = { km: "km_KH", en: "en_US" };

/**
 * Every page lives under /[lang], so the share card is resolved per locale:
 * og:url points at the localized URL and og:locale / hreflang tell scrapers
 * and search engines which language they got.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = locales.includes(lang as (typeof locales)[number])
    ? lang
    : defaultLocale;
  const title = `${siteName} — ${siteTagline}`;

  return {
    ...siteConfig,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
        "x-default": `/${defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName,
      title,
      description: siteDescription,
      url: `${siteUrl}/${locale}`,
      locale: OG_LOCALES[locale] ?? OG_LOCALES[defaultLocale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALES[l]),
      images: [{ url: siteOgImage, width: 1200, height: 630, alt: title }],
    },
  };
}

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

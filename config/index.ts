import type { Metadata } from "next";

/**
 * Absolute origin used to resolve every relative URL in the metadata below
 * (og:image, og:url, canonical…). Link scrapers — Facebook, Messenger,
 * Telegram, WhatsApp, X, Slack — will not follow a relative image path, so
 * NEXT_PUBLIC_APP_URL must be the real public origin in production.
 */
export const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const siteName = "EduKids";
export const siteTagline = "Learn, play and grow";
export const siteDescription =
  "A playful learning platform for kids — Khmer, English and Math lessons, stories, quizzes and rewards, with progress your family can follow.";

/** 1200x630 share card (generated from the mascot in public/edu-logo.png). */
export const siteOgImage = "/og.png";

export const siteConfig: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  // Launch full-screen (no Safari chrome) when added to the iOS/iPadOS home
  // screen, which fixes the "zoomed"/scrollbar behavior.
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    url: siteUrl,
    images: [
      {
        url: siteOgImage,
        width: 1200,
        height: 630,
        alt: `${siteName} — ${siteTagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    images: [siteOgImage],
  },
  keywords: [
    "EduKids",
    "kids learning app",
    "learning platform for kids",
    "Khmer for kids",
    "English for kids",
    "math for kids",
    "kids reading",
    "educational games",
    "Cambodia education",
  ],
};

export const links = {
  sourceCode: "https://github.com/sanidhyy/duolingo-clone",
  email: "sanidhya.verma12345@gmail.com",
} as const;

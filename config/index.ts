import type { Metadata } from "next";

export const siteConfig: Metadata = {
  title: "EduKids",
  description:
    "Interactive learning platform for kids — courses, quizzes, a learning journey, and rewards.",
  // Launch full-screen (no Safari chrome) when added to the iOS/iPadOS home
  // screen, which fixes the "zoomed"/scrollbar behavior.
  appleWebApp: {
    capable: true,
    title: "EduKids",
    statusBarStyle: "default",
  },
  keywords: [
    "reactjs",
    "nextjs",
    "vercel",
    "react",
    "duolingo-clone",
    "learn-language",
    "shadcn",
    "shadcn-ui",
    "radix-ui",
    "cn",
    "clsx",
    "Edukids",
    "postgresql",
    "sonner",
    "drizzle",
    "zustand",
    "mysql",
    "lucide-react",
    "supabase",
    "postcss",
    "prettier",
    "react-dom",
    "tailwindcss",
    "tailwindcss-animate",
    "ui/ux",
    "js",
    "javascript",
    "typescript",
    "eslint",
    "html",
    "css",
  ] as Array<string>,
  authors: {
    name: "Sanidhya Kumar Verma",
    url: "https://github.com/sanidhyy",
  },
} as const;

export const links = {
  sourceCode: "https://github.com/sanidhyy/duolingo-clone",
  email: "sanidhya.verma12345@gmail.com",
} as const;

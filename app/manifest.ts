import type { MetadataRoute } from "next";

// PWA manifest — makes "Add to Home Screen" install a real standalone app
// (no browser chrome) on iPad/iPhone/Android, which fixes the zoomed/scrollbar
// behavior reported on iPad. Served at /manifest.webmanifest and auto-linked.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduKids",
    short_name: "EduKids",
    description:
      "Interactive learning platform for kids — courses, quizzes, and rewards.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/edu-logo.png",
        sizes: "2184x1952",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

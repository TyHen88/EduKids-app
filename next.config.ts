import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    // Course/profile images can be arbitrary URLs pasted by parents/admins, so
    // we allow any HTTPS host. Trade-off: this turns the Next.js image optimizer
    // into an open image proxy (a malicious actor could request optimization of
    // any external image). Acceptable here; tighten to a fixed allowlist if that
    // becomes a concern. See next/image remotePatterns docs.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

"use client";

import { useEffect } from "react";

/**
 * Locks <body> scrolling while the component is mounted so the app shell
 * (fixed header + floating bottom nav) never moves — only the inner scroll
 * container scrolls. Restores the previous values on unmount, so document-style
 * routes (marketing, auth) keep their normal page scroll.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const { overflow, overscrollBehavior } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.overscrollBehavior = overscrollBehavior;
    };
  }, []);
}

"use client";

import { useEffect, useRef } from "react";

import { useMusic } from "@/store/use-music";

// Click sound effect played on every button tap in the student app. Mounted
// once in the (main) shell; uses event delegation on the document so it covers
// all buttons without wiring each one. Triggered by a real user click, so it's
// exempt from autoplay restrictions.
const SRC = "/button-audi.mp3";
const VOLUME = 0.4;

type Props = {
  // Admin master audio switch. When false the whole app is silent (matches the
  // background music gating), so clicks are silent too.
  enabled: boolean;
};

export const ButtonClickSound = ({ enabled }: Props) => {
  const childEnabled = useMusic((state) => state.enabled);
  const on = enabled && childEnabled;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload one reusable audio element.
  useEffect(() => {
    const audio = new Audio(SRC);
    audio.volume = VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!on) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Match real buttons and button-like elements (incl. shadcn Button
      // rendered as a link via asChild, and icon buttons).
      const el = target?.closest<HTMLElement>(
        'button, [role="button"], a[href]'
      );
      if (!el) return;
      if (el.getAttribute("aria-disabled") === "true") return;
      if ((el as HTMLButtonElement).disabled) return;

      const audio = audioRef.current;
      if (!audio) return;
      // Restart so rapid taps each click; ignore play() rejections.
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [on]);

  return null;
};

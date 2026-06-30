"use client";

import { useEffect } from "react";
import { useAudio } from "react-use";

import { useMusic } from "@/store/use-music";

// Looping background music for the student app. Rendered once from the (main)
// shell layout so it keeps playing across page navigations.
//
// Playback is gated by two switches:
//   - adminEnabled: the global, admin-managed setting. When false, nothing
//     plays (and the shell also hides the toggle icon).
//   - the learner's own on/off preference (useMusic store, persisted locally).
// Volume (0–100) is set by the admin.
const MUSIC_SRC = "/Piki%20-%20Kitty.mp3"; // public/"Piki - Kitty.mp3"

type Props = {
  adminEnabled: boolean;
  volume: number; // 0–100
};

export const BackgroundMusic = ({ adminEnabled, volume }: Props) => {
  const childEnabled = useMusic((state) => state.enabled);
  const playing = adminEnabled && childEnabled;

  const [audio, , controls] = useAudio({
    src: MUSIC_SRC,
    loop: true,
    autoPlay: false,
  });

  // Apply the admin volume (clamped, 0–100 → 0–1) whenever it changes.
  useEffect(() => {
    const v = Math.max(0, Math.min(100, volume)) / 100;
    controls.volume(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  // Play / pause from the combined switch. play() may reject before the first
  // user gesture — expected; the gesture listener below recovers from it.
  useEffect(() => {
    if (playing) {
      void controls.play();
    } else {
      controls.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Autoplay fallback: browsers block audio until the first interaction, so
  // (re)try playing on the first tap/key press while music should be on.
  useEffect(() => {
    if (!playing) return;

    const start = () => void controls.play();
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });

    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return audio;
};

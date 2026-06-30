"use client";

import { useEffect } from "react";
import { useAudio } from "react-use";

import { useMusic } from "@/store/use-music";

// Looping background music for the student app. Rendered once from the (main)
// shell layout so it keeps playing across page navigations. Kept at a low
// volume so it sits under the lesson sound effects.
// File is public/"Piki - Kitty.mp3" — encode the spaces for the URL.
const MUSIC_SRC = "/Piki%20-%20Kitty.mp3";
const VOLUME = 0.2;

export const BackgroundMusic = () => {
  const enabled = useMusic((state) => state.enabled);
  const [audio, , controls] = useAudio({
    src: MUSIC_SRC,
    loop: true,
    autoPlay: false,
  });

  // Set the volume once the element exists.
  useEffect(() => {
    controls.volume(VOLUME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play / pause in response to the user's preference. play() may reject when
  // the browser hasn't seen a user gesture yet — that's expected; the gesture
  // listener below recovers from it.
  useEffect(() => {
    if (enabled) {
      void controls.play();
    } else {
      controls.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Autoplay fallback: browsers block audio until the first interaction, so
  // (re)try playing on the first tap/key press while music is enabled.
  useEffect(() => {
    if (!enabled) return;

    const start = () => void controls.play();
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });

    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return audio;
};

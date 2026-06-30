import { create } from "zustand";
import { persist } from "zustand/middleware";

type MusicState = {
  // Whether the user wants background music on. Persisted to localStorage so
  // the choice survives reloads. Note: even when `enabled` is true the audio
  // may not be playing yet — browsers block autoplay until the first user
  // gesture (BackgroundMusic handles that).
  enabled: boolean;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
};

export const useMusic = create<MusicState>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: "edukids-music" }
  )
);

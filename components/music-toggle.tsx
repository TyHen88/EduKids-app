"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMusic } from "@/store/use-music";

// Header button to mute/unmute the background music. The on/off state is read
// from a persisted store, so before hydration we render the default ("on") to
// match the server output and avoid a hydration mismatch.
export const MusicToggle = () => {
  const enabled = useMusic((state) => state.enabled);
  const toggle = useMusic((state) => state.toggle);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const on = mounted ? enabled : true;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Mute music" : "Play music"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm transition-colors",
        on
          ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:border-indigo-500"
          : "border-slate-200 bg-slate-100 text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
      )}
    >
      {on ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
      <span className="sr-only">{on ? "Mute music" : "Play music"}</span>
    </button>
  );
};

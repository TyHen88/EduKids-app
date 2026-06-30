"use client";

import { useEffect, useState } from "react";
import { useAudio } from "react-use";
import { Music, Volume2, Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { updateAudioSettings } from "@/actions/settings";
import { useDictionary } from "@/app/[lang]/lang-provider";

// Same track the learners hear (public/"Piki - Kitty.mp3"), so the admin
// preview matches the real thing.
const PREVIEW_SRC = "/Piki%20-%20Kitty.mp3";

type Props = {
  lang: string;
  musicEnabled: boolean;
  musicVolume: number; // 0–100
};

/**
 * Admin-only global background-music controls (on/off + volume) with a live
 * audio preview: while the admin drags the volume slider, the actual track
 * plays at that volume so they can hear it. Saves to the single
 * `audio_settings` row. When music is off, learners get no music and the
 * toggle icon is hidden for them.
 */
export const AdminAudioSettings = ({
  lang,
  musicEnabled,
  musicVolume,
}: Props) => {
  const dict = useDictionary();
  const [enabled, setEnabled] = useState(musicEnabled);
  const [volume, setVolume] = useState(musicVolume);
  const [saving, setSaving] = useState(false);

  const [audio, audioState, controls] = useAudio({
    src: PREVIEW_SRC,
    loop: true,
    autoPlay: false,
  });
  const previewing = audioState.playing;

  // Keep the live preview's volume in sync with the slider (0–100 → 0–1).
  useEffect(() => {
    controls.volume(Math.max(0, Math.min(100, volume)) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  const togglePreview = () => {
    if (previewing) {
      controls.pause();
    } else {
      controls.volume(Math.max(0, Math.min(100, volume)) / 100);
      void controls.play();
    }
  };

  const save = (next: { musicEnabled: boolean; musicVolume: number }) => {
    setSaving(true);
    updateAudioSettings(next, lang)
      .then(() =>
        toast.success(dict["admin.audioSaved"] || "Music settings saved")
      )
      .catch(() => {
        // Revert the optimistic UI on failure.
        setEnabled(musicEnabled);
        setVolume(musicVolume);
        toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
      })
      .finally(() => setSaving(false));
  };

  const onToggle = (next: boolean) => {
    setEnabled(next); // optimistic
    if (!next) controls.pause(); // stop any preview when turning music off
    save({ musicEnabled: next, musicVolume: volume });
  };

  // Commit volume on release (onChange updates the slider + preview live; we
  // persist once the user lets go to avoid a write per pixel).
  const onVolumeCommit = (next: number) => {
    save({ musicEnabled: enabled, musicVolume: next });
  };

  return (
    <section className="rounded-[32px] border-2 border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      {audio}

      <div className="mb-2 flex items-center gap-2">
        <Music className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-bold tracking-tight text-slate-800">
          {dict["admin.soundMusic"] || "Sound & Music"}
        </h2>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      <p className="mb-5 text-sm font-medium text-slate-500">
        {dict["admin.soundMusicDesc"] ||
          "Configure background music for learners. Turning it off hides the music control for kids."}
      </p>

      {/* Music on/off */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-slate-100 p-4">
        <span className="flex items-center gap-3 font-bold text-slate-700">
          <Volume2 className="h-5 w-5 text-indigo-600" />
          {dict["admin.musicEnabled"] || "Background music"}
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={saving}
          aria-label={dict["admin.musicEnabled"] || "Background music"}
        />
      </div>

      {/* Volume + live preview */}
      <div
        className={`mt-3 rounded-2xl border-2 border-slate-100 p-4 transition-opacity ${
          enabled ? "" : "pointer-events-none opacity-50"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold text-slate-700">
            {dict["admin.musicVolume"] || "Music volume"}
          </span>
          <span className="font-black text-slate-800">{volume}%</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePreview}
            disabled={!enabled}
            title={
              previewing
                ? dict["admin.stopPreview"] || "Stop preview"
                : dict["admin.previewMusic"] || "Preview music"
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:border-indigo-500 disabled:opacity-50"
          >
            {previewing ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span className="sr-only">
              {previewing
                ? dict["admin.stopPreview"] || "Stop preview"
                : dict["admin.previewMusic"] || "Preview music"}
            </span>
          </button>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={volume}
            disabled={!enabled}
            onChange={(e) => setVolume(Number(e.target.value))}
            onPointerUp={(e) => onVolumeCommit(Number(e.currentTarget.value))}
            onKeyUp={(e) => onVolumeCommit(Number(e.currentTarget.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
            aria-label={dict["admin.musicVolume"] || "Music volume"}
          />
        </div>

        <p className="mt-3 text-xs font-medium text-slate-400">
          {dict["admin.previewHint"] ||
            "Press play to hear the music and drag the slider to set the volume kids will hear."}
        </p>
      </div>
    </section>
  );
};

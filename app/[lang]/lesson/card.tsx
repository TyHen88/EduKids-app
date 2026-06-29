"use client";

import { useCallback } from "react";

import Image from "next/image";
import { useAudio, useKey } from "react-use";
import { motion } from "motion/react";


import { cn } from "@/lib/utils";

type CardProps = {
  id: number;
  text: string;
  imageSrc: string | null;
  audioSrc: string | null;
  shortcut: string;
  selected?: boolean;
  onClick: () => void;
  status?: "correct" | "wrong" | "none";
  disabled?: boolean;
  type: "SELECT" | "ASSIST";
};

export const Card = ({
  text,
  imageSrc,
  audioSrc,
  shortcut,
  selected,
  onClick,
  status,
  disabled,
  type,
}: CardProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audio, _, controls] = useAudio({ src: audioSrc || "" });

  const handleClick = useCallback(() => {
    if (disabled) return;

    void controls.play();
    onClick();
  }, [disabled, onClick, controls]);

  useKey(shortcut, handleClick, {}, [handleClick]);

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      animate={
        selected && status === "wrong"
          ? { x: [0, -6, 6, -4, 4, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.3 }}
      className={cn(
        "h-full cursor-pointer rounded-2xl border-2 border-b-4 bg-white p-4 transition-colors hover:bg-slate-50 active:border-b-2 lg:p-6",
        "border-slate-200",
        selected && "border-indigo-300 bg-indigo-50 hover:bg-indigo-50",
        selected &&
          status === "correct" &&
          "border-emerald-300 bg-emerald-50 hover:bg-emerald-50",
        selected &&
          status === "wrong" &&
          "border-rose-300 bg-rose-50 hover:bg-rose-50",
        disabled && "pointer-events-none hover:bg-white",
        type === "ASSIST" && "w-full lg:p-3"
      )}
    >
      {audio}
      {imageSrc && (
        <div className="relative mb-4 aspect-square max-h-[80px] w-full lg:max-h-[150px]">
          <Image src={imageSrc} fill alt={text} className="object-contain" sizes="(min-width: 1024px) 150px, 80px" />
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between",
          type === "ASSIST" && "flex-row-reverse"
        )}
      >
        {type === "ASSIST" && <div aria-hidden />}
        <p
          className={cn(
            "text-lg font-black text-slate-800 lg:text-2xl",
            selected && "text-indigo-700",
            selected && status === "correct" && "text-emerald-600",
            selected && status === "wrong" && "text-rose-600"
          )}
        >
          {text}
        </p>

        {/* Keyboard shortcut index — intentionally small/muted so it isn't
            mistaken for the answer value. */}
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold text-slate-300 lg:h-6 lg:w-6 lg:text-xs",
            "border-slate-200",
            selected && "border-indigo-200 text-indigo-400",
            selected &&
              status === "correct" &&
              "border-emerald-300 text-emerald-400",
            selected && status === "wrong" && "border-rose-300 text-rose-400"
          )}
        >
          {shortcut}
        </div>
      </div>
    </motion.div>
  );
};

"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { motion } from "motion/react";

import { Progress } from "@/components/ui/progress";
import { useExitModal } from "@/store/use-exit-modal";

type HeaderProps = {
  percentage: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

export const Header = ({ percentage }: HeaderProps) => {
  const { open } = useExitModal();
  const [elapsed, setElapsed] = useState(0);

  // Count up from when the lesson is opened.
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = pad(Math.floor(elapsed / 60));
  const seconds = pad(elapsed % 60);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-[1140px] items-center justify-between gap-x-7 px-6 pt-[20px] lg:px-10 lg:pt-[50px]"
    >
      <button
        onClick={open}
        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Exit lesson"
      >
        <X className="h-6 w-6" />
      </button>

      <Progress value={percentage} />

      <div
        className="flex shrink-0 items-center gap-2 text-lg font-black tabular-nums text-indigo-600"
        title="Time elapsed"
      >
        <Clock className="h-6 w-6 shrink-0" />
        <span>
          {minutes}:{seconds}
        </span>
      </div>
    </motion.header>
  );
};

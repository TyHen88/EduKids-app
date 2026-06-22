"use client";

import { Clock } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";

type ResultCardProps = {
  value: number;
  variant: "points" | "time";
};

const pad = (n: number) => String(n).padStart(2, "0");

export const ResultCard = ({ value, variant }: ResultCardProps) => {
  const dict = useDictionary();
  const isPoints = variant === "points";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={cn(
        "w-full rounded-2xl border-2",
        isPoints ? "border-indigo-500 bg-indigo-500" : "border-emerald-500 bg-emerald-500"
      )}
    >
      <div
        className={cn(
          "rounded-t-xl p-1.5 text-center text-xs font-bold uppercase tracking-wide text-white",
          isPoints ? "bg-indigo-500" : "bg-emerald-500"
        )}
      >
        {isPoints
          ? dict["lesson.totalXP"] || "Total XP"
          : dict["lesson.timeSpent"] || "Time"}
      </div>

      <div
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-2xl bg-white p-6 text-lg font-black",
          isPoints ? "text-indigo-600" : "text-emerald-600"
        )}
      >
        {isPoints ? (
          <>
            <Image src="/points.svg" alt="points" height={30} width={30} />
            {value}
          </>
        ) : (
          <>
            <Clock className="h-6 w-6" />
            {pad(Math.floor(value / 60))}:{pad(value % 60)}
          </>
        )}
      </div>
    </motion.div>
  );
};

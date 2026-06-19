"use client";

import { InfinityIcon } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";

type ResultCardProps = {
  value: number;
  variant: "points" | "hearts";
};

export const ResultCard = ({ value, variant }: ResultCardProps) => {
  const imageSrc = variant === "points" ? "/points.svg" : "/heart.svg";
  const dict = useDictionary();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={cn(
        "w-full rounded-2xl border-2",
        variant === "points" && "border-indigo-500 bg-indigo-500",
        variant === "hearts" && "border-rose-500 bg-rose-500"
      )}
    >
      <div
        className={cn(
          "rounded-t-xl p-1.5 text-center text-xs font-bold uppercase tracking-wide text-white",
          variant === "points" && "bg-indigo-500",
          variant === "hearts" && "bg-rose-500"
        )}
      >
        {variant === "hearts"
          ? dict["lesson.heartsLeft"] || "Hearts Left"
          : dict["lesson.totalXP"] || "Total XP"}
      </div>

      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-white p-6 text-lg font-black",
          variant === "points" && "text-indigo-600",
          variant === "hearts" && "text-rose-500"
        )}
      >
        <Image
          src={imageSrc}
          alt={variant}
          height={30}
          width={30}
          className="mr-1.5"
        />
        {value === Infinity ? (
          <InfinityIcon className="h-6 w-6 stroke-[3]" />
        ) : (
          value
        )}
      </div>
    </motion.div>
  );
};

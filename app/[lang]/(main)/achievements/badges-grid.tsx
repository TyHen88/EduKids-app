"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type BadgeItem = {
  id: number;
  name: string;
  icon: string;
  description: string;
};

type BadgesGridProps = {
  badges: BadgeItem[];
  earnedIds: number[];
};

export const BadgesGrid = ({ badges, earnedIds }: BadgesGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {badges.map((badge, i) => {
        const isEarned = earnedIds.includes(badge.id);

        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex flex-col items-center rounded-[32px] border-2 p-6 text-center transition-all sm:p-8",
              isEarned
                ? "border-indigo-100 bg-white shadow-sm hover:scale-105 hover:border-indigo-200 hover:shadow-md"
                : "border-slate-200 bg-slate-50 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0"
            )}
          >
            <div className="mb-4 text-5xl drop-shadow-sm filter sm:text-7xl">
              {badge.icon}
            </div>
            <h3 className="mb-2 font-bold leading-tight text-slate-900">
              {badge.name}
            </h3>
            <p className="text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
              {badge.description}
            </p>
            {!isEarned && (
              <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Locked
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

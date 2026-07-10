"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { feedBuddy } from "@/actions/cosmic";
import { getBuddy, FEED_COST } from "@/lib/buddy";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Props = {
  buddyName: string;
  buddyXp: number;
  points: number;
  lang: string;
};

export const CompanionBuddy = ({ buddyName, buddyXp, points, lang }: Props) => {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pop, setPop] = useState(0);

  const buddy = getBuddy(buddyXp);
  const canFeed = points >= FEED_COST;

  const onFeed = () => {
    startTransition(() => {
      feedBuddy(lang)
        .then((res) => {
          if (res?.error === "stardust") {
            toast.error(
              dict["learn.notEnoughStardust"] ||
                "Not enough Stardust to feed your buddy."
            );
            return;
          }
          setPop((p) => p + 1);
          toast.success(
            `${buddyName} ${dict["learn.buddyLovedThat"] || "loved that!"} +${res?.gainedXp} XP`
          );
          router.refresh();
        })
        .catch(() =>
          toast.error(
            dict["common.somethingWentWrong"] || "Something went wrong."
          )
        );
    });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-b-4 border-indigo-100 border-b-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 shadow-sm">
      {/* cosmic glow + twinkles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-200/40 blur-2xl" />
      <Sparkles className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-indigo-300" />
      <Sparkles className="pointer-events-none absolute bottom-3 right-10 h-3 w-3 text-purple-300" />

      <div className="relative mb-3 text-sm font-black tracking-tight text-slate-800">
        {dict["learn.yourBuddy"] || "Your Buddy"}
      </div>

      <div className="relative flex flex-1 items-center gap-3">
        <motion.div
          key={pop}
          initial={pop ? { scale: 1.4, rotate: -8 } : false}
          animate={{ scale: 1, rotate: 0, y: [0, -6, 0] }}
          transition={{
            y: { repeat: Infinity, duration: 2.6, ease: "easeInOut" },
            scale: { type: "spring", stiffness: 300, damping: 12 },
          }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-100 to-purple-100 text-3xl shadow-inner sm:h-16 sm:w-16 sm:text-4xl"
        >
          {buddy.stage.emoji}
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-base font-black text-slate-800 sm:text-lg">
              {buddyName}
            </h3>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-600">
              {buddy.stage.name}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${buddy.progressToNext}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400">
              {buddy.isMaxStage
                ? dict["learn.max"] || "MAX"
                : `${buddy.xpToNext} XP`}
            </span>
          </div>
        </div>

        <button
          onClick={onFeed}
          disabled={pending || !canFeed}
          className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-3 py-2 text-[11px] font-black leading-none text-white shadow transition-all hover:bg-indigo-700 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star className="h-4 w-4 fill-current" />
          {dict["learn.feed"] || "Feed"}
          <span className="text-[9px] opacity-80">({FEED_COST})</span>
        </button>
      </div>
    </div>
  );
};

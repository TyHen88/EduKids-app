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
    <div className="relative overflow-hidden rounded-3xl border-2 border-b-4 border-indigo-100 border-b-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      {/* twinkles */}
      <Sparkles className="absolute right-4 top-4 h-5 w-5 text-indigo-300" />
      <Sparkles className="absolute bottom-6 right-10 h-3 w-3 text-purple-300" />

      <div className="mb-3 flex items-center gap-2 text-base font-black tracking-tight text-slate-800 sm:mb-4 sm:text-lg">
        <span>{dict["learn.yourBuddy"] || "Your Buddy"}</span>
      </div>

      <div className="flex items-center gap-4 sm:gap-5">
        <motion.div
          key={pop}
          initial={pop ? { scale: 1.4, rotate: -8 } : false}
          animate={{ scale: 1, rotate: 0, y: [0, -8, 0] }}
          transition={{
            y: { repeat: Infinity, duration: 2.6, ease: "easeInOut" },
            scale: { type: "spring", stiffness: 300, damping: 12 },
          }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-3xl shadow-inner sm:h-24 sm:w-24 sm:text-5xl"
        >
          {buddy.stage.emoji}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-800">{buddyName}</h3>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              {buddy.stage.name}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${buddy.progressToNext}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {buddy.isMaxStage
                ? dict["learn.max"] || "MAX"
                : `${buddy.xpToNext} XP`}
            </span>
          </div>

          <button
            onClick={onFeed}
            disabled={pending || !canFeed}
            className="mt-4 flex items-center gap-1.5 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow transition-all hover:bg-indigo-700 active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star className="h-4 w-4 fill-current" />
            {dict["learn.feed"] || "Feed"} ({FEED_COST})
          </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Flame, Star } from "lucide-react";
import { toast } from "sonner";

import { openDailyChest } from "@/actions/cosmic";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Props = {
  available: boolean;
  streak: number;
  lang: string;
};

export const DailyChest = ({ available, streak, lang }: Props) => {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reward, setReward] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(!available);

  const onOpen = () => {
    startTransition(() => {
      openDailyChest(lang)
        .then((res) => {
          if (res?.error === "claimed") {
            setClaimed(true);
            toast.info(
              dict["learn.chestAlreadyOpened"] ||
                "Already opened today — come back tomorrow!"
            );
            return;
          }
          if (res?.ok) {
            setReward(res.reward);
            setClaimed(true);
            // let the reveal animation play before refreshing the stats
            setTimeout(() => router.refresh(), 1400);
          }
        })
        .catch(() =>
          toast.error(
            dict["common.somethingWentWrong"] || "Something went wrong."
          )
        );
    });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-b-4 border-amber-100 border-b-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm">
      {/* warm glow */}
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-orange-200/40 blur-2xl" />

      <div className="relative mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black tracking-tight text-slate-800">
          {dict["learn.dailyChest"] || "Daily Chest"}
        </h2>
        <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-600">
          <Flame className="h-3 w-3 fill-current" /> {streak}{" "}
          {dict["learn.day"] || "day"}
        </span>
      </div>

      <div className="relative flex flex-1 items-center">
        <AnimatePresence mode="wait">
          {reward !== null ? (
            <motion.div
              key="reward"
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-1 text-3xl font-black text-amber-500">
                <Star className="h-8 w-8 fill-current" /> +{reward}
              </div>
              <p className="text-xs font-bold leading-tight text-slate-500">
                {dict["learn.stardustCollected"] || "Stardust collected!"}
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="chest"
              onClick={onOpen}
              disabled={pending || claimed}
              whileHover={!claimed ? { scale: 1.03 } : undefined}
              whileTap={!claimed ? { scale: 0.95 } : undefined}
              className="flex items-center gap-3 text-left disabled:cursor-not-allowed"
            >
              <motion.span
                animate={
                  claimed ? { y: 0 } : { y: [0, -5, 0], rotate: [-3, 3, -3] }
                }
                transition={
                  claimed
                    ? undefined
                    : { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
                }
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-white shadow-inner sm:h-16 sm:w-16",
                  claimed
                    ? "bg-slate-100"
                    : "bg-gradient-to-br from-amber-100 to-orange-100"
                )}
              >
                <Gift
                  className={
                    claimed
                      ? "h-7 w-7 text-slate-300 sm:h-8 sm:w-8"
                      : "h-7 w-7 text-amber-500 drop-shadow sm:h-8 sm:w-8"
                  }
                />
              </motion.span>
              <span className="text-sm font-bold leading-tight text-slate-600">
                {claimed
                  ? dict["learn.comeBackTomorrow"] || "Come back tomorrow!"
                  : dict["learn.tapToOpen"] || "Tap to open!"}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

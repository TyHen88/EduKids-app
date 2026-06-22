"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Flame, Star } from "lucide-react";
import { toast } from "sonner";

import { openDailyChest } from "@/actions/cosmic";

type Props = {
  available: boolean;
  streak: number;
  lang: string;
};

export const DailyChest = ({ available, streak, lang }: Props) => {
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
            toast.info("Already opened today — come back tomorrow!");
            return;
          }
          if (res?.ok) {
            setReward(res.reward);
            setClaimed(true);
            // let the reveal animation play before refreshing the stats
            setTimeout(() => router.refresh(), 1400);
          }
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-b-4 border-amber-100 border-b-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h2 className="text-base font-black tracking-tight text-slate-800 sm:text-lg">
          Daily Chest
        </h2>
        <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-600">
          <Flame className="h-3.5 w-3.5 fill-current" /> {streak} day
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-1 text-center sm:gap-3 sm:py-2">
        <AnimatePresence mode="wait">
          {reward !== null ? (
            <motion.div
              key="reward"
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-1 text-4xl font-black text-amber-500">
                <Star className="h-9 w-9 fill-current" /> +{reward}
              </div>
              <p className="text-sm font-bold text-slate-500">
                Stardust collected!
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="chest"
              onClick={onOpen}
              disabled={pending || claimed}
              whileHover={!claimed ? { scale: 1.05 } : undefined}
              whileTap={!claimed ? { scale: 0.95 } : undefined}
              animate={
                claimed
                  ? { y: 0 }
                  : { y: [0, -6, 0], rotate: [-2, 2, -2] }
              }
              transition={
                claimed
                  ? undefined
                  : { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
              }
              className="flex flex-col items-center gap-2 disabled:cursor-not-allowed"
            >
              <Gift
                className={
                  claimed
                    ? "h-12 w-12 text-slate-300 sm:h-16 sm:w-16"
                    : "h-12 w-12 text-amber-500 drop-shadow sm:h-16 sm:w-16"
                }
              />
              <span className="text-sm font-bold text-slate-500">
                {claimed ? "Come back tomorrow!" : "Tap to open!"}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

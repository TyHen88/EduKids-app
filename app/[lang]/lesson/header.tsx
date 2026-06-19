"use client";

import { InfinityIcon, X } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

import { Progress } from "@/components/ui/progress";
import { useExitModal } from "@/store/use-exit-modal";

type HeaderProps = {
  hearts: number;
  percentage: number;
  hasActiveSubscription: boolean;
};

export const Header = ({
  hearts,
  percentage,
  hasActiveSubscription,
}: HeaderProps) => {
  const { open } = useExitModal();

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

      <motion.div
        key={hearts}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex items-center text-lg font-black text-rose-500"
      >
        <Image
          src="/heart.svg"
          height={28}
          width={28}
          alt="Heart"
          className="mr-2"
        />
        {hasActiveSubscription ? (
          <InfinityIcon className="h-6 w-6 shrink-0 stroke-[3]" />
        ) : (
          hearts
        )}
      </motion.div>
    </motion.header>
  );
};

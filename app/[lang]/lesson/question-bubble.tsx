"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { useDictionary } from "@/app/[lang]/lang-provider";

type QuestionBubbleProps = {
  question: string;
};

export const QuestionBubble = ({ question }: QuestionBubbleProps) => {
  const dict = useDictionary();

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-6 flex items-center gap-x-4"
    >
      <Image
        src="/edu-logo.png"
        alt={dict["lesson.mascot"] || "Mascot"}
        height={60}
        width={60}
        className="hidden lg:block"
      />
      <Image
        src="/edu-logo.png"
        alt={dict["lesson.mascot"] || "Mascot"}
        height={40}
        width={40}
        className="block lg:hidden"
      />

      <div className="relative rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm lg:text-base">
        {question}

        <div
          className="absolute -left-3 top-1/2 h-0 w-0 -translate-y-1/2 rotate-90 transform border-x-8 border-t-8 border-x-transparent border-t-slate-200"
          aria-hidden
        />
      </div>
    </motion.div>
  );
};

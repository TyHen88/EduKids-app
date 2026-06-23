"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useKey, useMedia } from "react-use";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDictionary, useLocale } from "@/app/[lang]/lang-provider";

type FooterProps = {
  onCheck: () => void;
  status: "correct" | "wrong" | "none" | "completed";
  disabled?: boolean;
  lessonId?: number;
  // Reading blocks (TEXT/IMAGE) aren't graded — show "Next" instead of "Check".
  reading?: boolean;
};

export const Footer = ({
  onCheck,
  status,
  disabled,
  lessonId,
  reading,
}: FooterProps) => {
  useKey("Enter", onCheck, {}, [onCheck]);
  const isMobile = useMedia("(max-width: 1024px)");
  const dict = useDictionary();
  const locale = useLocale();

  return (
    <motion.footer
      animate={
        status === "correct"
          ? { backgroundColor: "#ecfdf5" }
          : status === "wrong"
            ? { backgroundColor: "#fff1f2" }
            : { backgroundColor: "#ffffff" }
      }
      transition={{ duration: 0.2 }}
      className={cn(
        "h-[100px] border-t-2 lg:h-[140px]",
        status === "correct" && "border-transparent",
        status === "wrong" && "border-transparent",
        status === "none" && "border-slate-200",
        status === "completed" && "border-slate-200"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-6 lg:px-10">
        <AnimatePresence mode="wait">
          {status === "correct" && (
            <motion.div
              key="correct"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center text-base font-black text-emerald-600 lg:text-2xl"
            >
              <CheckCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
              {dict["lesson.nicelyDone"] || "Nicely done!"}
            </motion.div>
          )}

          {status === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center text-base font-black text-rose-500 lg:text-2xl"
            >
              <XCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
              {dict["lesson.tryAgain"] || "Try again."}
            </motion.div>
          )}
        </AnimatePresence>

        {status === "completed" && (
          <Button
            variant="default"
            size={isMobile ? "sm" : "lg"}
            onClick={() =>
              (window.location.href = `/${locale}/lesson/${lessonId}`)
            }
          >
            {dict["lesson.practiceAgain"] || "Practice again"}
          </Button>
        )}

        {/* Only an explicit action while choosing or finishing — correct/wrong
            progress automatically. */}
        {status === "none" && (
          <Button
            disabled={disabled}
            aria-disabled={disabled}
            className="ml-auto"
            onClick={onCheck}
            size={isMobile ? "sm" : "lg"}
            variant={reading ? "primary" : "secondary"}
          >
            {reading
              ? dict["lesson.next"] || "Next"
              : dict["lesson.check"] || "Check"}
          </Button>
        )}

        {status === "completed" && (
          <Button
            className="ml-auto"
            onClick={onCheck}
            size={isMobile ? "sm" : "lg"}
            variant="secondary"
          >
            {dict["lesson.continue"] || "Continue"}
          </Button>
        )}
      </div>
    </motion.footer>
  );
};

"use client";

import { useEffect, useState, useTransition } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useAudio, useWindowSize, useMount } from "react-use";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { reduceHearts } from "@/actions/user-progress";
import { MAX_HEARTS } from "@/constants";
import { challengeOptions, challenges } from "@/db/schema";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { useDictionary, useLocale } from "@/app/[lang]/lang-provider";

import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { ResultCard } from "./result-card";

type QuizProps = {
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  userSubscription: { isActive: boolean } | null;
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialLessonChallenges,
  userSubscription,
}: QuizProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incorrectAudio, _i, incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio] = useAudio({
    src: "/finish.mp3",
    autoPlay: true,
  });
  const { width, height } = useWindowSize();

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();
  const dict = useDictionary();
  const locale = useLocale();

  useMount(() => {
    if (initialPercentage === 100) openPracticeModal();
  });

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(() => {
    return initialPercentage === 100 ? 0 : initialPercentage;
  });
  const [challenges] = useState(initialLessonChallenges);
  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex(
      (challenge) => !challenge.completed
    );

    return uncompletedIndex === -1 ? 0 : uncompletedIndex;
  });

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"none" | "wrong" | "correct">("none");
  const [combo, setCombo] = useState(0);

  const challenge = challenges[activeIndex];
  const options = challenge?.challengeOptions ?? [];

  const onSelect = (id: number) => {
    if (status !== "none") return;

    setSelectedOption(id);
  };

  // Auto-advance after a correct answer; auto-clear after a wrong one so the
  // learner can pick again — no Next/Retry button needed.
  useEffect(() => {
    if (status === "none") return;

    const wasCorrect = status === "correct";
    const timeout = setTimeout(
      () => {
        if (wasCorrect) setActiveIndex((current) => current + 1);
        setStatus("none");
        setSelectedOption(undefined);
      },
      wasCorrect ? 900 : 1100
    );

    return () => clearTimeout(timeout);
  }, [status]);

  const onContinue = () => {
    if (!selectedOption) return;

    // While feedback is showing, the effect above handles progression.
    if (status !== "none") return;

    const correctOption = options.find((option) => option.correct);

    if (!correctOption) return;

    if (correctOption.id === selectedOption) {
      startTransition(() => {
        upsertChallengeProgress(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            void correctControls.play();
            setStatus("correct");
            setCombo((prev) => prev + 1);
            setPercentage((prev) => prev + 100 / challenges.length);

            // This is a practice
            if (initialPercentage === 100) {
              setHearts((prev) => Math.min(prev + 1, MAX_HEARTS));
            }
          })
          .catch(() =>
            toast.error(dict["common.somethingWentWrong"] || "Something went wrong. Please try again.")
          );
      });
    } else {
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            void incorrectControls.play();
            setStatus("wrong");
            setCombo(0);

            if (!response?.error) setHearts((prev) => Math.max(prev - 1, 0));
          })
          .catch(() =>
            toast.error(dict["common.somethingWentWrong"] || "Something went wrong. Please try again.")
          );
      });
    }
  };

  if (!challenge) {
    return (
      <>
        {finishAudio}
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-y-4 text-center lg:gap-y-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          >
            <Image src="/finish.svg" alt="Finish" height={100} width={100} />
          </motion.div>

          <h1 className="text-lg font-black text-slate-800 lg:text-3xl">
            {dict["lesson.greatJob"] || "Great job!"} <br />{" "}
            {dict["lesson.completedLesson"] || "You've completed the lesson."}
          </h1>

          <div className="flex w-full items-center gap-x-4">
            <ResultCard variant="points" value={challenges.length * 10} />
            <ResultCard
              variant="hearts"
              value={userSubscription?.isActive ? Infinity : hearts}
            />
          </div>
        </motion.div>

        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => router.push(`/${locale}/learn`)}
        />
      </>
    );
  }

  const title =
    challenge.type === "ASSIST"
      ? (dict["lesson.selectCorrectMeaning"] || "Select the correct meaning")
      : challenge.question;

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />

      {/* In-lesson combo streak */}
      <AnimatePresence>
        {combo >= 3 && (
          <motion.div
            key={combo}
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 14 }}
            className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full border-2 border-orange-300 bg-gradient-to-r from-orange-400 to-rose-500 px-5 py-2 text-sm font-black uppercase tracking-widest text-white shadow-lg">
              <span className="text-lg">🔥</span> On fire! x{combo}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1">
        <div className="flex h-full items-center justify-center">
          <div className="flex w-full flex-col gap-y-12 px-6 lg:min-h-[350px] lg:w-[600px] lg:px-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col gap-y-12"
              >
                <h1 className="text-center text-lg font-black text-slate-800 lg:text-start lg:text-3xl">
                  {title}
                </h1>

                <div>
                  {challenge.type === "ASSIST" && (
                    <QuestionBubble question={challenge.question} />
                  )}

                  <Challenge
                    options={options}
                    onSelect={onSelect}
                    status={status}
                    selectedOption={selectedOption}
                    disabled={pending}
                    type={challenge.type}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer
        disabled={pending || !selectedOption}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};

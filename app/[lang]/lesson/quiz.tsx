"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useAudio, useWindowSize, useMount } from "react-use";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { upsertLessonBlockProgress } from "@/actions/lesson-block-progress";
import { saveLessonTime } from "@/actions/lesson-time";
import { reduceHearts } from "@/actions/user-progress";
import { MAX_HEARTS } from "@/constants";
import { lessonBlockOptions, lessonBlocks } from "@/db/schema";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { useDictionary, useLocale } from "@/app/[lang]/lang-provider";

import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { ResultCard } from "./result-card";
import { ContentBlock } from "./content-block";

type QuizProps = {
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  initialLessonBlocks: (typeof lessonBlocks.$inferSelect & {
    completed: boolean;
    lessonBlockOptions: (typeof lessonBlockOptions.$inferSelect)[];
  })[];
  userSubscription: { isActive: boolean } | null;
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialLessonBlocks,
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

  const [isReview] = useState(initialPercentage === 100);
  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(() => {
    return initialPercentage === 100 ? 0 : initialPercentage;
  });
  const [blocks] = useState(initialLessonBlocks);
  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = blocks.findIndex((block) => !block.completed);
    return uncompletedIndex === -1 ? 0 : uncompletedIndex;
  });

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"none" | "wrong" | "correct">("none");
  const [combo, setCombo] = useState(0);

  const block = blocks[activeIndex];
  const options = block?.lessonBlockOptions ?? [];

  // Track time spent + wrong answers (per question block), recorded once when
  // the lesson finishes.
  const startTimeRef = useRef(Date.now());
  const wrongByBlockRef = useRef<
    Record<number, { count: number; optionIds: number[] }>
  >({});
  const timeSavedRef = useRef(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!block && !timeSavedRef.current) {
      timeSavedRef.current = true;
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(seconds);
      const wrongDetail = Object.entries(wrongByBlockRef.current).map(
        ([blockId, v]) => ({
          blockId: Number(blockId),
          count: v.count,
          optionIds: v.optionIds,
        })
      );
      void saveLessonTime(lessonId, seconds, wrongDetail);
    }
  }, [block, lessonId]);

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
    // While feedback is showing, the effect above handles progression.
    if (status !== "none") return;

    const isNonInteractive = block.type === "TEXT" || block.type === "IMAGE";

    if (!isNonInteractive && !selectedOption) return;

    // Reading blocks (TEXT/IMAGE) are not graded — there's no right or wrong.
    // Just record progress and move on, with no correct/wrong feedback, no
    // sound, no combo and no hearts change. (Unlike quizzes/challenges below.)
    if (isNonInteractive) {
      startTransition(() => {
        upsertLessonBlockProgress(block.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            setPercentage((prev) => prev + 100 / blocks.length);
            setActiveIndex((current) => current + 1);
          })
          .catch(() =>
            toast.error(
              dict["common.somethingWentWrong"] ||
                "Something went wrong. Please try again."
            )
          );
      });
      return;
    }

    const correctOption = options.find((option) => option.correct);

    if (correctOption && correctOption.id === selectedOption) {
      startTransition(() => {
        upsertLessonBlockProgress(block.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            void correctControls.play();
            setStatus("correct");
            setCombo((prev) => prev + 1);
            setPercentage((prev) => prev + 100 / blocks.length);

            // This is a practice
            if (isReview) {
              setHearts((prev) => Math.min(prev + 1, MAX_HEARTS));
            }
          })
          .catch(() =>
            toast.error(
              dict["common.somethingWentWrong"] || "Something went wrong. Please try again."
            )
          );
      });
    } else {
      startTransition(() => {
        reduceHearts(block.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            void incorrectControls.play();
            setStatus("wrong");
            setCombo(0);
            // Record this wrong answer for the specific question block, along
            // with the option the child chose (only reachable for SELECT/ASSIST).
            {
              const entry =
                wrongByBlockRef.current[block.id] ?? { count: 0, optionIds: [] };
              entry.count += 1;
              if (
                selectedOption != null &&
                !entry.optionIds.includes(selectedOption)
              ) {
                entry.optionIds.push(selectedOption);
              }
              wrongByBlockRef.current[block.id] = entry;
            }

            if (!response?.error) setHearts((prev) => Math.max(prev - 1, 0));
          })
          .catch(() =>
            toast.error(
              dict["common.somethingWentWrong"] || "Something went wrong. Please try again."
            )
          );
      });
    }
  };

  if (!block) {
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
            <Image
              src="/finish.svg"
              alt={dict["lesson.finish"] || "Finish"}
              height={100}
              width={100}
            />
          </motion.div>

          <h1 className="text-lg font-black text-slate-800 lg:text-3xl">
            {dict["lesson.greatJob"] || "Great job!"} <br />{" "}
            {dict["lesson.completedLesson"] || "You've completed the lesson."}
          </h1>

          <div className="flex w-full items-center gap-x-4">
            {/* Review/practice runs don't award points — only show time. */}
            {!isReview && (
              <ResultCard variant="points" value={blocks.length * 10} />
            )}
            <ResultCard variant="time" value={elapsedSeconds} />
          </div>
        </motion.div>

        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => {
            window.location.href = `/${locale}/path`;
          }}
        />
      </>
    );
  }

  const isNonInteractive = block.type === "TEXT" || block.type === "IMAGE";
  const title =
    block.type === "ASSIST"
      ? dict["lesson.selectCorrectMeaning"] || "Select the correct meaning"
      : block.type === "SELECT"
        ? block.question
        : "";

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <Header percentage={percentage} />

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
              <span className="text-lg">🔥</span>{" "}
              {dict["lesson.onFire"] || "On fire!"} x{combo}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1">
        <div className="flex h-full items-center justify-center">
          <div
            className={cn(
              "flex w-full flex-col gap-y-12 px-3 lg:min-h-[350px] lg:px-0",
              // Reading pages use the full width for comfortable reading;
              // quizzes/challenges keep the narrower centered column.
              isNonInteractive ? "lg:w-[1000px]" : "lg:w-[600px]"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col gap-y-12"
              >
                {title && (
                  <h1 className="text-center text-lg font-black text-slate-800 lg:text-start lg:text-3xl">
                    {title}
                  </h1>
                )}

                <div>
                  {block.type === "ASSIST" && (
                    <QuestionBubble question={block.question || ""} />
                  )}

                  {isNonInteractive ? (
                    <ContentBlock
                      type={block.type}
                      body={block.body}
                      imageSrc={block.imageSrc}
                      caption={block.caption}
                      imagePosition={block.imagePosition}
                    />
                  ) : (
                    <Challenge
                      options={options}
                      onSelect={onSelect}
                      status={status}
                      selectedOption={selectedOption}
                      disabled={pending}
                      type={block.type as "SELECT" | "ASSIST"}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer
        disabled={pending || (!isNonInteractive && !selectedOption)}
        status={status}
        onCheck={onContinue}
        reading={isNonInteractive}
      />
    </>
  );
};

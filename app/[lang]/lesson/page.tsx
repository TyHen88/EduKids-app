import { redirect } from "next/navigation";

import { getLesson, getUserProgress, getUserSubscription } from "@/db/queries";

import { Quiz } from "./quiz";

type Props = {
  params: Promise<{
    lang: string;
  }>;
};

const LessonPage = async ({ params }: Props) => {
  const { lang } = await params;
  const lessonData = getLesson();
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();

  const [lesson, userProgress, userSubscription] = await Promise.all([
    lessonData,
    userProgressData,
    userSubscriptionData,
  ]);

  if (!lesson || !userProgress) return redirect(`/${lang}/learn`);

  const initialPercentage =
    (lesson.lessonBlocks.filter((block) => block.completed).length /
      lesson.lessonBlocks.length) *
    100;

  return (
    <Quiz
      initialLessonId={lesson.id}
      initialLessonBlocks={lesson.lessonBlocks}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      userSubscription={userSubscription}
    />
  );
};

export default LessonPage;

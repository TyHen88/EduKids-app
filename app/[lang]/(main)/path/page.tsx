import { redirect } from "next/navigation";

import { LearningPath, type PathNode } from "@/components/learning-path";
import { getUnits, getUserProgress } from "@/db/queries";

type Props = {
  params: Promise<{ lang: string }>;
};

const PathPage = async ({ params }: Props) => {
  const { lang } = await params;

  const [userProgress, units] = await Promise.all([
    getUserProgress(),
    getUnits(),
  ]);

  if (!userProgress || !userProgress.activeCourse)
    redirect(`/${lang}/courses`);

  // Flatten lessons (unit order, then lesson order) into journey nodes.
  const flat = units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      lesson,
      unitTitle: unit.title,
      isLastInUnit: unit.lessons[unit.lessons.length - 1]?.id === lesson.id,
    }))
  );

  // First uncompleted lesson is "unlocked"; everything after it is "locked".
  let unlockedAssigned = false;

  const nodes: PathNode[] = flat.map(({ lesson, unitTitle, isLastInUnit }, i) => {
    const isLastOverall = i === flat.length - 1;

    let status: PathNode["status"];
    if (lesson.completed) {
      status = "completed";
    } else if (!unlockedAssigned) {
      status = "unlocked";
      unlockedAssigned = true;
    } else {
      status = "locked";
    }

    const type: PathNode["type"] = isLastOverall
      ? "exam"
      : isLastInUnit
        ? "quiz"
        : "lesson";

    return {
      id: lesson.id,
      title: lesson.title,
      unitTitle,
      type,
      status,
      href: status === "locked" ? null : `/${lang}/lesson/${lesson.id}`,
    };
  });

  if (nodes.length === 0) redirect(`/${lang}/courses`);

  return (
    <LearningPath nodes={nodes} courseTitle={userProgress.activeCourse.title} />
  );
};

export default PathPage;

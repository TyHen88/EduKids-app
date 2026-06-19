import { cache } from "react";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import db from "./drizzle";
import {
  challengeProgress,
  courses,
  lessons,
  units,
  userBadges,
  userProgress,
} from "./schema";

export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();

  return data;
});

export const getUserProgress = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

export const getUnits = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) return [];

  const data = await db.query.units.findMany({
    where: eq(units.courseId, userProgress.activeCourseId),
    orderBy: (units, { asc }) => [asc(units.order)],
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      if (lesson.challenges.length === 0)
        return { ...lesson, completed: false };

      const allCompletedChallenges = lesson.challenges.every((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return { ...lesson, completed: allCompletedChallenges };
    });

    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
          },
        },
      },
    },
  });

  return data;
});

export const getCourseProgress = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) return null;

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgress.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInActiveCourse
    .flatMap((unit) => unit.lessons)
    .find((lesson) => {
      return lesson.challenges.some((challenge) => {
        return (
          !challenge.challengeProgress ||
          challenge.challengeProgress.length === 0 ||
          challenge.challengeProgress.some((progress) => !progress.completed)
        );
      });
    });

  return {
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});

export const getLesson = cache(async (id?: number) => {
  const { userId } = await auth();

  if (!userId) return null;

  const courseProgress = await getCourseProgress();
  const lessonId = id || courseProgress?.activeLessonId;

  if (!lessonId) return null;

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        with: {
          challengeOptions: true,
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.challenges) return null;

  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed =
      challenge.challengeProgress &&
      challenge.challengeProgress.length > 0 &&
      challenge.challengeProgress.every((progress) => progress.completed);

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges };
});

export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeLessonId) return 0;

  const lesson = await getLesson(courseProgress?.activeLessonId);

  if (!lesson) return 0;

  const completedChallenges = lesson.challenges.filter(
    (challenge) => challenge.completed
  );

  const percentage = Math.round(
    (completedChallenges.length / lesson.challenges.length) * 100
  );

  return percentage;
});

// Subscriptions are stubbed (Stripe removed in this build). Always "Pro" so
// hearts are effectively unlimited. Kept because gameplay actions branch on it.
export const getUserSubscription = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  return {
    id: 1,
    userId,
    isActive: true,
  };
});

export const getTopTenUsers = cache(async () => {
  const { userId } = await auth();

  if (!userId) return [];

  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    },
  });

  return data;
});

// --- Courses decorated with the current user's progress (for "My Courses") ---

export type CourseWithProgress = {
  id: number;
  title: string;
  imageSrc: string;
  description: string;
  category: string;
  difficulty: string;
  totalLessons: number;
  completedLessons: number;
  progress: number; // 0-100
  status: "Not Started" | "In Progress" | "Completed";
  isActive: boolean;
};

export const getCoursesWithProgress = cache(
  async (): Promise<CourseWithProgress[]> => {
    const { userId } = await auth();
    const activeUserProgress = await getUserProgress();

    const data = await db.query.courses.findMany({
      orderBy: (courses, { asc }) => [asc(courses.id)],
      with: {
        units: {
          with: {
            lessons: {
              with: {
                challenges: {
                  with: {
                    challengeProgress: userId
                      ? { where: eq(challengeProgress.userId, userId) }
                      : { limit: 0 },
                  },
                },
              },
            },
          },
        },
      },
    });

    return data.map((course) => {
      const allLessons = course.units.flatMap((unit) => unit.lessons);
      const totalLessons = allLessons.length;

      const completedLessons = allLessons.filter((lesson) => {
        if (lesson.challenges.length === 0) return false;
        return lesson.challenges.every(
          (challenge) =>
            challenge.challengeProgress.length > 0 &&
            challenge.challengeProgress.every((progress) => progress.completed)
        );
      }).length;

      const progress =
        totalLessons === 0
          ? 0
          : Math.round((completedLessons / totalLessons) * 100);

      const status: CourseWithProgress["status"] =
        progress === 0
          ? "Not Started"
          : progress >= 100
            ? "Completed"
            : "In Progress";

      return {
        id: course.id,
        title: course.title,
        imageSrc: course.imageSrc,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        totalLessons,
        completedLessons,
        progress,
        status,
        isActive: activeUserProgress?.activeCourseId === course.id,
      };
    });
  }
);

// --- Badges (achievements) ---------------------------------------------------

export const getBadges = cache(async () => {
  return db.query.badges.findMany({
    orderBy: (badges, { asc }) => [asc(badges.id)],
  });
});

export const getUserBadges = cache(async () => {
  const { userId } = await auth();

  if (!userId) return [];

  const data = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    with: { badge: true },
  });

  return data;
});

// --- Admin dashboard stats (gate access at the page/layout level) ------------

export const getAdminStats = cache(async () => {
  const [students, courseCount, lessonCount, completions] = await Promise.all([
    db.$count(userProgress),
    db.$count(courses),
    db.$count(lessons),
    db.$count(challengeProgress, eq(challengeProgress.completed, true)),
  ]);

  return { students, courses: courseCount, lessons: lessonCount, completions };
});

export const getAllStudents = cache(async () => {
  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    with: {
      activeCourse: true,
      userBadges: true,
    },
  });

  return data.map((student) => ({
    userId: student.userId,
    userName: student.userName,
    userImageSrc: student.userImageSrc,
    points: student.points,
    hearts: student.hearts,
    streak: student.streak,
    activeCourse: student.activeCourse?.title ?? null,
    badges: student.userBadges.length,
  }));
});

export type AdminCourse = {
  id: number;
  title: string;
  imageSrc: string;
  description: string;
  category: string;
  difficulty: string;
  units: number;
  lessons: number;
  students: number;
};

export const getAdminCourseTree = cache(async (courseId: number) => {
  return db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
            with: {
              challenges: {
                orderBy: (challenges, { asc }) => [asc(challenges.order)],
                with: {
                  challengeOptions: {
                    orderBy: (challengeOptions, { asc }) => [
                      asc(challengeOptions.id),
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});

export const getAdminCourses = cache(async (): Promise<AdminCourse[]> => {
  const [data, enrollments] = await Promise.all([
    db.query.courses.findMany({
      orderBy: (courses, { asc }) => [asc(courses.id)],
      with: { units: { with: { lessons: true } } },
    }),
    db.query.userProgress.findMany({ columns: { activeCourseId: true } }),
  ]);

  return data.map((course) => ({
    id: course.id,
    title: course.title,
    imageSrc: course.imageSrc,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    units: course.units.length,
    lessons: course.units.reduce((acc, unit) => acc + unit.lessons.length, 0),
    students: enrollments.filter((e) => e.activeCourseId === course.id).length,
  }));
});

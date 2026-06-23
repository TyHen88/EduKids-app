import { cache } from "react";

import { eq, ilike, not, and, inArray, isNull, or } from "drizzle-orm";

import db from "./drizzle";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminIds } from "@/lib/admin";
import {
  lessonBlockProgress,
  lessonTime,
  courses,
  lessons,
  units,
  userBadges,
  userProgress,
  userFollowers,
  appNotifications,
  familyMembers,
  courseAssignments,
} from "./schema";

// Returns only public (admin-created) courses. Private parent-created courses are excluded.
export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany({
    where: isNull(courses.createdBy),
  });

  return data;
});

// Returns public courses + the current parent's own private courses.
// Used by the parent's course assignment page.
export const getCoursesForParent = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.courses.findMany({
    where: or(isNull(courses.createdBy), eq(courses.createdBy, userId)),
  });

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

// The signed-in user's leaderboard rank by points (ties share a rank).
// Returns { rank, total, points } or null when not signed in / no profile.
export const getUserRank = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const me = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true },
  });
  if (!me) return null;

  const everyone = await db.query.userProgress.findMany({
    columns: { points: true },
  });

  const rank = everyone.filter((u) => u.points > me.points).length + 1;
  return { rank, total: everyone.length, points: me.points };
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
          lessonBlocks: {
            orderBy: (lessonBlocks, { asc }) => [asc(lessonBlocks.order)],
            with: {
              lessonBlockProgress: {
                where: eq(lessonBlockProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      if (lesson.lessonBlocks.length === 0)
        return { ...lesson, completed: false };

      const allCompletedBlocks = lesson.lessonBlocks.every((block) => {
        return (
          block.lessonBlockProgress &&
          block.lessonBlockProgress.length > 0 &&
          block.lessonBlockProgress.every((progress) => progress.completed)
        );
      });

      return { ...lesson, completed: allCompletedBlocks };
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
          lessonBlocks: {
            with: {
              lessonBlockProgress: {
                where: eq(lessonBlockProgress.userId, userId),
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
      return lesson.lessonBlocks.some((block) => {
        return (
          !block.lessonBlockProgress ||
          block.lessonBlockProgress.length === 0 ||
          block.lessonBlockProgress.some((progress) => !progress.completed)
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
      lessonBlocks: {
        orderBy: (lessonBlocks, { asc }) => [asc(lessonBlocks.order)],
        with: {
          lessonBlockOptions: true,
          lessonBlockProgress: {
            where: eq(lessonBlockProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.lessonBlocks) return null;

  const normalizedBlocks = data.lessonBlocks.map((block) => {
    const completed =
      block.lessonBlockProgress &&
      block.lessonBlockProgress.length > 0 &&
      block.lessonBlockProgress.every((progress) => progress.completed);

    return { ...block, completed };
  });

  return { ...data, lessonBlocks: normalizedBlocks };
});

export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeLessonId) return 0;

  const lesson = await getLesson(courseProgress?.activeLessonId);

  if (!lesson) return 0;

  const completedBlocks = lesson.lessonBlocks.filter(
    (block) => block.completed
  );

  const percentage = Math.round(
    (completedBlocks.length / lesson.lessonBlocks.length) * 100
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

// --- Friends / Connections ---------------------------------------------------

export const getFollowing = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.userFollowers.findMany({
    where: and(
      eq(userFollowers.followerId, userId),
      eq(userFollowers.isAccepted, true)
    ),
    with: {
      following: true,
    },
  });

  return data.map((f) => f.following);
});

export const getFollowers = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.userFollowers.findMany({
    where: and(
      eq(userFollowers.followingId, userId),
      eq(userFollowers.isAccepted, true)
    ),
    with: {
      follower: true,
    },
  });

  return data.map((f) => f.follower);
});

export const getPendingRequests = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.userFollowers.findMany({
    where: and(
      eq(userFollowers.followingId, userId),
      eq(userFollowers.isAccepted, false)
    ),
    with: {
      follower: true,
    },
  });

  return data.map((f) => f.follower);
});

export const getSentRequests = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.userFollowers.findMany({
    where: and(
      eq(userFollowers.followerId, userId),
      eq(userFollowers.isAccepted, false)
    ),
    with: {
      following: true,
    },
  });

  return data.map((f) => f.following);
});

export const getTopFriends = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  let followingIds: string[] = [userId];

  // Check if child user
  const parentLink = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.childId, userId),
  });

  if (parentLink) {
    const siblings = await db.query.familyMembers.findMany({
      where: eq(familyMembers.parentId, parentLink.parentId),
    });
    followingIds = siblings.map((s) => s.childId);
    followingIds.push(parentLink.parentId); // include parent
  } else {
    const following = await getFollowing();
    followingIds = following.map((f) => f.userId);
    followingIds.push(userId); // include self
  }

  const data = await db.query.userProgress.findMany({
    where: inArray(userProgress.userId, followingIds),
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
      role: true,
    },
  });

  if (parentLink) {
    data.sort((a, b) => {
      if (a.role === "parent" && b.role !== "parent") return -1;
      if (b.role === "parent" && a.role !== "parent") return 1;
      return b.points - a.points; // otherwise sort by points descending
    });
  }

  return data;
});

export const searchUsers = cache(async (query: string, offset: number = 0) => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.userProgress.findMany({
    where: query 
      ? and(ilike(userProgress.userName, `%${query}%`), not(eq(userProgress.userId, userId)))
      : not(eq(userProgress.userId, userId)),
    limit: 10,
    offset: offset,
  });

  return data;
});

export const getIsChild = cache(async () => {
  const { userId } = await auth();
  if (!userId) return false;

  const parentLink = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.childId, userId),
  });

  return !!parentLink;
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

    let childCourseIds: number[] | null = null;
    if (userId) {
      // Check if this user is a child (has a parent)
      const parentLink = await db.query.familyMembers.findFirst({
        where: eq(familyMembers.childId, userId),
      });

      if (parentLink) {
        // This user is a child. Fetch their assigned courses.
        const assignments = await db.query.courseAssignments.findMany({
          where: eq(courseAssignments.childId, userId),
        });
        childCourseIds = assignments.map(a => a.courseId);
        
        // If a child has no assigned courses, return an empty backpack
        if (childCourseIds.length === 0) {
          return [];
        }
      }
    }

    const data = await db.query.courses.findMany({
      // Children see exactly their assigned courses (which may include their
      // own parent's private ones). Everyone else sees only PUBLIC courses —
      // a parent's private course must never appear in another user's backpack.
      where: childCourseIds
        ? inArray(courses.id, childCourseIds)
        : isNull(courses.createdBy),
      orderBy: (courses, { asc }) => [asc(courses.id)],
      with: {
        units: {
          with: {
            lessons: {
              with: {
                lessonBlocks: {
                  with: {
                    lessonBlockProgress: userId
                      ? { where: eq(lessonBlockProgress.userId, userId) }
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
        if (lesson.lessonBlocks.length === 0) return false;
        return lesson.lessonBlocks.every(
          (block) =>
            block.lessonBlockProgress.length > 0 &&
            block.lessonBlockProgress.every((progress) => progress.completed)
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
  const adminIds = getAdminIds();
  const [students, courseCount, lessonCount, completions] = await Promise.all([
    // exclude admin operators from the user count (matches the Users list)
    db.$count(
      userProgress,
      adminIds.length ? not(inArray(userProgress.userId, adminIds)) : undefined
    ),
    db.$count(courses),
    db.$count(lessons),
    db.$count(lessonBlockProgress, eq(lessonBlockProgress.completed, true)),
  ]);

  return { students, courses: courseCount, lessons: lessonCount, completions };
});

export const getAllStudents = cache(async () => {
  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    with: {
      activeCourse: true,
      userBadges: true,
      // family link where this user is the child → who their parent is
      parentsAsChild: {
        with: { parent: true },
      },
    },
  });

  // Admins are platform operators, not learners/parents — keep them out of the
  // user list and its parent/learner counts.
  const adminIds = new Set(getAdminIds());

  return data
    .filter((student) => !adminIds.has(student.userId))
    .map((student) => ({
    userId: student.userId,
    userName: student.userName,
    userImageSrc: student.userImageSrc,
    role: student.role, // "learner" | "parent"
    isActive: student.isActive,
    points: student.points,
    hearts: student.hearts,
    streak: student.streak,
    activeCourse: student.activeCourse?.title ?? null,
    badges: student.userBadges.length,
    // null when the learner isn't linked to any parent account
    parentName: student.parentsAsChild[0]?.parent?.userName ?? null,
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
  createdBy: string | null;
  // Display name of the creator. null = system/admin course (createdBy is null).
  creatorName: string | null;
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
              lessonBlocks: {
                orderBy: (lessonBlocks, { asc }) => [asc(lessonBlocks.order)],
                with: {
                  lessonBlockOptions: {
                    orderBy: (lessonBlockOptions, { asc }) => [
                      asc(lessonBlockOptions.id),
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
  const [data, users] = await Promise.all([
    db.query.courses.findMany({
      orderBy: (courses, { asc }) => [asc(courses.id)],
      with: { units: { with: { lessons: true } } },
    }),
    db.query.userProgress.findMany({
      columns: { userId: true, userName: true, activeCourseId: true },
    }),
  ]);

  const nameById = new Map(users.map((u) => [u.userId, u.userName]));

  return data.map((course) => ({
    id: course.id,
    title: course.title,
    imageSrc: course.imageSrc,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    units: course.units.length,
    lessons: course.units.reduce((acc, unit) => acc + unit.lessons.length, 0),
    students: users.filter((e) => e.activeCourseId === course.id).length,
    createdBy: course.createdBy,
    creatorName: course.createdBy ? nameById.get(course.createdBy) ?? null : null,
  }));
});

// --- App Notifications -------------------------------------------------------

export const getUserNotifications = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.appNotifications.findMany({
    where: eq(appNotifications.userId, userId),
    orderBy: (appNotifications, { desc }) => [desc(appNotifications.createdAt)],
  });

  return data;
});

export const getUnreadNotificationCount = cache(async () => {
  const { userId } = await auth();
  if (!userId) return 0;

  const data = await db.query.appNotifications.findMany({
    where: and(
      eq(appNotifications.userId, userId),
      eq(appNotifications.isRead, false)
    ),
  });

  return data.length;
});

// --- Family / Parent Features ------------------------------------------------

export const getChildren = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.familyMembers.findMany({
    where: eq(familyMembers.parentId, userId),
    with: {
      child: {
        with: {
          activeCourse: true,
        },
      },
    },
  });

  const children = data.map((fm) => fm.child);
  if (children.length === 0)
    return children.map((c) => ({
      ...c,
      username: null as string | null,
      totalSeconds: 0,
    }));

  // Total learning time per child (sum of all recorded lesson times).
  const times = await db.query.lessonTime.findMany({
    where: inArray(
      lessonTime.userId,
      children.map((c) => c.userId)
    ),
  });
  const secondsByUser = new Map<string, number>();
  for (const t of times) {
    secondsByUser.set(t.userId, (secondsByUser.get(t.userId) ?? 0) + t.seconds);
  }

  // The login username lives in the auth provider (Supabase, in user_metadata),
  // not in our DB, so enrich each child with it for display. Degrade gracefully
  // if the auth API is unreachable.
  const usernameById = new Map<string, string | null>();
  try {
    const admin = createAdminClient();
    const results = await Promise.all(
      children.map((c) => admin.auth.admin.getUserById(c.userId))
    );
    for (const { data } of results) {
      const u = data.user;
      if (u) {
        const meta = u.user_metadata ?? {};
        usernameById.set(u.id, meta.username ?? meta.user_name ?? null);
      }
    }
  } catch {
    // ignore — fall back to no username
  }

  return children.map((c) => ({
    ...c,
    username: usernameById.get(c.userId) ?? null,
    totalSeconds: secondsByUser.get(c.userId) ?? 0,
  }));
});

export const getChildProgress = cache(async (childId: string) => {
  const { userId } = await auth();
  if (!userId) return null;

  // Verify this child actually belongs to the parent
  const isFamily = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.parentId, userId),
      eq(familyMembers.childId, childId)
    ),
  });

  if (!isFamily) return null;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, childId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

// All courses assigned to a child, each decorated with the child's progress
// (completed/total lessons, %) and time spent (per lesson + course total).
// Scoped to the parent's own children for safety.
export const getChildCourses = cache(async (childId: string) => {
  const { userId } = await auth();
  if (!userId) return [];

  const isFamily = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.parentId, userId),
      eq(familyMembers.childId, childId)
    ),
  });
  if (!isFamily) return [];

  const assignments = await db.query.courseAssignments.findMany({
    where: eq(courseAssignments.childId, childId),
  });
  const courseIds = assignments.map((a) => a.courseId);
  if (courseIds.length === 0) return [];

  // Time spent per lesson by this child (seconds + last update).
  const times = await db.query.lessonTime.findMany({
    where: eq(lessonTime.userId, childId),
  });
  const timeByLesson = new Map(
    times.map((t) => [
      t.lessonId,
      {
        seconds: t.seconds,
        wrongAnswers: t.wrongAnswers,
        wrongDetail: t.wrongDetail ?? [],
        updatedAt: t.updatedAt,
      },
    ])
  );

  const data = await db.query.courses.findMany({
    where: inArray(courses.id, courseIds),
    orderBy: (courses, { asc }) => [asc(courses.id)],
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
            with: {
              lessonBlocks: {
                orderBy: (lessonBlocks, { asc }) => [asc(lessonBlocks.order)],
                with: {
                  lessonBlockOptions: true,
                  lessonBlockProgress: {
                    where: eq(lessonBlockProgress.userId, childId),
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const isQuestion = (type: string) => type === "SELECT" || type === "ASSIST";

  return data.map((course) => {
    let courseQuestions = 0;
    let courseAnswered = 0;

    const units = course.units.map((u) => ({
      id: u.id,
      title: u.title,
      lessons: u.lessons.map((lesson) => {
        const completed =
          lesson.lessonBlocks.length > 0 &&
          lesson.lessonBlocks.every((b) =>
            b.lessonBlockProgress.some((p) => p.completed)
          );

        const lt = timeByLesson.get(lesson.id);
        const blockById = new Map(lesson.lessonBlocks.map((b) => [b.id, b]));

        // Question-block accounting (reading blocks excluded) → feeds the score.
        const questionBlocks = lesson.lessonBlocks.filter((b) => isQuestion(b.type));
        const answeredQuestions = questionBlocks.filter((b) =>
          b.lessonBlockProgress.some((p) => p.completed)
        ).length;
        courseQuestions += questionBlocks.length;
        courseAnswered += answeredQuestions;

        // Which questions were wrong — with the question text, the correct
        // answer, and what the child actually chose.
        const wrongQuestions = (lt?.wrongDetail ?? [])
          .filter((d) => d.count > 0)
          .map((d) => {
            const b = blockById.get(d.blockId);
            const opts = b?.lessonBlockOptions ?? [];
            const correctAnswer = opts.find((o) => o.correct)?.text ?? null;
            const chosenAnswers = (d.optionIds ?? [])
              .map((id) => opts.find((o) => o.id === id)?.text)
              .filter((t): t is string => Boolean(t));
            return {
              blockId: d.blockId,
              count: d.count,
              question: b?.question || (b ? `Question ${b.order}` : "Question"),
              correctAnswer,
              chosenAnswers,
            };
          })
          .sort((a, b) => b.count - a.count);

        return {
          id: lesson.id,
          title: lesson.title,
          completed,
          seconds: lt?.seconds ?? 0,
          wrongAnswers: lt?.wrongAnswers ?? 0,
          wrongQuestions,
        };
      }),
    }));

    const allLessons = units.flatMap((u) => u.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter((l) => l.completed).length;
    const progress =
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    const totalSeconds = allLessons.reduce((s, l) => s + l.seconds, 0);
    const totalWrong = allLessons.reduce((s, l) => s + l.wrongAnswers, 0);
    const lessonsWithTime = allLessons.filter((l) => l.seconds > 0).length;
    const avgSeconds =
      lessonsWithTime === 0 ? 0 : Math.round(totalSeconds / lessonsWithTime);

    // Score = first-try accuracy on answered questions (correct vs. all
    // attempts). null until the child has answered at least one question.
    const attempts = courseAnswered + totalWrong;
    const score = attempts === 0 ? null : Math.round((courseAnswered / attempts) * 100);
    const grade =
      score === null
        ? null
        : score >= 90
          ? "A"
          : score >= 80
            ? "B"
            : score >= 70
              ? "C"
              : score >= 60
                ? "D"
                : "F";

    // Most recent lesson-time update across this course's lessons.
    let lastActiveAt: Date | null = null;
    for (const l of allLessons) {
      const t = timeByLesson.get(l.id);
      if (t && (!lastActiveAt || t.updatedAt > lastActiveAt)) lastActiveAt = t.updatedAt;
    }

    return {
      id: course.id,
      title: course.title,
      imageSrc: course.imageSrc,
      category: course.category,
      totalLessons,
      completedLessons,
      progress,
      totalSeconds,
      totalWrong,
      avgSeconds,
      totalQuestions: courseQuestions,
      answeredQuestions: courseAnswered,
      score,
      grade,
      lastActiveAt,
      units,
    };
  });
});

export const getCourseAssignments = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.courseAssignments.findMany({
    where: eq(courseAssignments.parentId, userId),
  });

  return data;
});

// --- Parent Course Management ------------------------------------------------

export type ParentCourse = {
  id: number;
  title: string;
  imageSrc: string;
  description: string;
  category: string;
  difficulty: string;
  units: number;
  lessons: number;
};

export const getParentCourses = cache(async (): Promise<ParentCourse[]> => {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db.query.courses.findMany({
    where: eq(courses.createdBy, userId),
    orderBy: (courses, { asc }) => [asc(courses.id)],
    with: { units: { with: { lessons: true } } },
  });

  return data.map((course) => ({
    id: course.id,
    title: course.title,
    imageSrc: course.imageSrc,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    units: course.units.length,
    lessons: course.units.reduce((acc, unit) => acc + unit.lessons.length, 0),
  }));
});

export const getParentCourseTree = cache(async (courseId: number) => {
  const { userId } = await auth();
  if (!userId) return null;

  const data = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), eq(courses.createdBy, userId)),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
            with: {
              lessonBlocks: {
                orderBy: (lessonBlocks, { asc }) => [asc(lessonBlocks.order)],
                with: { lessonBlockOptions: true },
              },
            },
          },
        },
      },
    },
  });

  return data ?? null;
});

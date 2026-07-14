"use server";

import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userProgress, familyGroups, familyGroupChildren, courseAssignments } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Activate or deactivate a user. Enforcement is app-level: deactivated users
 * keep their auth session but every authenticated layout redirects them to the
 * /deactivated page (see lib/guard.ts). We intentionally do NOT disable them in
 * the auth provider — only flip the `isActive` flag here.
 */
export const setUserActive = async (
  targetUserId: string,
  active: boolean,
  lang = "km"
) => {
  if (!(await getIsAdmin())) throw new Error("Unauthorized.");

  const { userId: adminId } = await auth();
  if (targetUserId === adminId) {
    throw new Error("You can't deactivate your own account.");
  }

  await db
    .update(userProgress)
    .set({ isActive: active })
    .where(eq(userProgress.userId, targetUserId));

  revalidatePath(`/${lang}/admin/students`);
  revalidatePath(`/${lang}/admin`);
};

export const deleteUserAccount = async (
  targetUserId: string,
  lang = "km"
) => {
  if (!(await getIsAdmin())) throw new Error("Unauthorized.");

  const { userId: adminId } = await auth();
  if (targetUserId === adminId) {
    throw new Error("You can't delete your own account.");
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(targetUserId);
    if (error) {
      console.error("Supabase admin deleteUser error:", error);
      // Don't throw, proceed to clean up our database anyway
    }
  } catch (error: any) {
    console.error("Error deleting user from Supabase:", error);
    // Don't throw, proceed to clean up our database anyway
  }

  // Always delete from userProgress to ensure the data is cleared
  await db.delete(userProgress).where(eq(userProgress.userId, targetUserId));

  revalidatePath(`/${lang}/admin/students`);
  revalidatePath(`/${lang}/admin`);
};

export type UserDetailResult = {
  userId: string;
  userName: string;
  userImageSrc: string;
  role: string;
  isActive: boolean;
  points: number;
  hearts: number;
  streak: number;
  buddyName: string;
  buddyXp: number;
  
  // Parent-specific fields
  familyName?: string;
  familyMotto?: string;
  familyCover?: string;
  children?: {
    userId: string;
    userName: string;
    userImageSrc: string;
    points: number;
    streak: number;
    activeCourse: string | null;
  }[];

  // Learner/Child-specific fields
  parentName?: string | null;
  isChild?: boolean;
  assignedCourses?: {
    courseId: number;
    courseTitle: string;
    assignedAt: string;
    notes: string | null;
  }[];
  activeCourseTitle?: string | null;
  collectedBadges?: {
    id: number;
    name: string;
    icon: string;
    description: string;
    earnedAt: string;
  }[];
};

export const getUserDetail = async (targetUserId: string): Promise<UserDetailResult> => {
  if (!(await getIsAdmin())) throw new Error("Unauthorized.");

  // 1. Fetch user progress
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, targetUserId),
    with: {
      activeCourse: true,
      userBadges: {
        with: {
          badge: true,
        },
      },
    },
  });

  if (!progress) throw new Error("User not found.");

  const result: UserDetailResult = {
    userId: progress.userId,
    userName: progress.userName,
    userImageSrc: progress.userImageSrc,
    role: progress.role,
    isActive: progress.isActive,
    points: progress.points,
    hearts: progress.hearts,
    streak: progress.streak,
    buddyName: progress.buddyName,
    buddyXp: progress.buddyXp,
    activeCourseTitle: progress.activeCourse?.title ?? null,
    collectedBadges: progress.userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      icon: ub.badge.icon,
      description: ub.badge.description,
      earnedAt: ub.earnedAt.toISOString(),
    })),
  };

  if (progress.role === "parent") {
    // 2. Fetch parent's family group & children
    const group = await db.query.familyGroups.findFirst({
      where: eq(familyGroups.ownerId, targetUserId),
      with: {
        children: {
          with: {
            child: {
              with: {
                activeCourse: true,
              },
            },
          },
        },
      },
    });

    if (group) {
      result.familyName = group.name;
      result.familyMotto = group.motto;
      result.familyCover = group.cover;
      result.children = group.children.map((c) => ({
        userId: c.child.userId,
        userName: c.child.userName,
        userImageSrc: c.child.userImageSrc,
        points: c.child.points,
        streak: c.child.streak,
        activeCourse: c.child.activeCourse?.title ?? null,
      }));
    } else {
      result.familyName = progress.familyName;
      result.familyMotto = progress.familyMotto;
      result.familyCover = progress.familyCover;
      result.children = [];
    }
  } else {
    // 3. Fetch learner/child link and assignments
    const childLink = await db.query.familyGroupChildren.findFirst({
      where: eq(familyGroupChildren.childId, targetUserId),
      with: {
        familyGroup: {
          with: {
            owner: true,
          },
        },
      },
    });

    result.isChild = !!childLink;
    result.parentName = childLink?.familyGroup?.owner?.userName ?? null;

    // Fetch assigned courses
    const assignments = await db.query.courseAssignments.findMany({
      where: eq(courseAssignments.childId, targetUserId),
      with: {
        course: true,
      },
    });

    result.assignedCourses = assignments.map((a) => ({
      courseId: a.courseId,
      courseTitle: a.course.title,
      assignedAt: a.assignedAt.toISOString(),
      notes: a.notes,
    }));
  }

  return result;
};

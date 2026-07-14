"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userProgress, familyGroups, familyGroupAdults, familyGroupChildren, courseAssignments, userBadges } from "@/db/schema";
import { MAX_HEARTS } from "@/constants";
import { notifyAdmins } from "@/actions/notifications";
import { recordCreateChild } from "@/actions/audit";

export const createChildAccount = async (
  name: string,
  username: string,
  pin: string,
  lang: string = "en"
) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  // Create the child's auth user in Supabase via the admin API. The login
  // identifier is the synthetic email `${username}@dummy.edukids.com` and the
  // password is derived from the 4-digit PIN (see kids-login). email_confirm
  // skips the verification email for these parent-managed accounts.
  const admin = createAdminClient();
  const securePassword = `${pin}-EduKids-Secret-Pin-!`;

  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@dummy.edukids.com`,
    password: securePassword,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      username,
    },
  });

  if (error || !data.user) {
    console.error("Supabase Create User Error:", error);
    throw new Error(error?.message || "Failed to create child account.");
  }

  const childId = data.user.id;

  // Insert into our userProgress DB as "learner"
  await db.insert(userProgress).values({
    userId: childId,
    userName: name,
    userImageSrc: "/edu-logo.png",
    role: "learner",
    hearts: MAX_HEARTS,
    points: 0,
    streak: 0,
  });

  // Find or create Family Group
  let familyGroupId: number;
  const ownedGroup = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });

  if (ownedGroup) {
    familyGroupId = ownedGroup.id;
  } else {
    const adultLink = await db.query.familyGroupAdults.findFirst({
      where: eq(familyGroupAdults.userId, userId),
    });
    if (adultLink) {
      if (!(adultLink.permissions as any)?.manage) {
        throw new Error("You do not have permission to add children to this family.");
      }
      familyGroupId = adultLink.familyGroupId;
    } else {
      const [newGroup] = await db.insert(familyGroups).values({
        ownerId: userId,
      }).returning();
      familyGroupId = newGroup.id;
    }
  }

  // Link child to Family Group
  await db.insert(familyGroupChildren).values({
    familyGroupId,
    childId: childId,
  });

  // Audit the action (the parent created a child account).
  void recordCreateChild(name).catch(() => {});

  // Alert admins about the new child account (in-app + web push). Fire-and-
  // forget: notifications must never block or delay the create flow.
  void notifyAdmins(
    "New user registered 🎉",
    `${name} was added as a new kid account.`,
    `/${lang}/admin/students`
  ).catch((e) => console.error("notifyAdmins failed", e));

  revalidatePath(`/${lang}/family/children`);
  revalidatePath(`/${lang}/family`);
  return { success: true, childId };
};

export const removeChildAccount = async (childId: string, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify family link
  const ownedGroup = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  const adultLink = await db.query.familyGroupAdults.findFirst({
    where: eq(familyGroupAdults.userId, userId),
  });
  
  if (!ownedGroup && adultLink) {
    if (!(adultLink.permissions as any)?.manage) {
      throw new Error("You do not have permission to remove children from this family.");
    }
  }
  
  const familyGroupId = ownedGroup?.id || adultLink?.familyGroupId;

  const link = familyGroupId ? await db.query.familyGroupChildren.findFirst({
    where: and(
      eq(familyGroupChildren.familyGroupId, familyGroupId),
      eq(familyGroupChildren.childId, childId)
    ),
  }) : null;

  if (!link) throw new Error("Not authorized to remove this child.");

  // Delete the auth user from Supabase.
  try {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(childId);
  } catch (error) {
    console.error("Error deleting user from Supabase:", error);
  }

  // Delete family link and progress (progress deletes automatically due to cascade, but good to be explicit)
  await db.delete(userProgress).where(eq(userProgress.userId, childId));

  revalidatePath(`/${lang}/family/children`);
  revalidatePath(`/${lang}/family`);
};

export const inviteFamilyAdult = async (email: string, permissions: any, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const group = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  if (!group) throw new Error("Only family group owners can invite adults.");

  const admin = createAdminClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/${lang}/set-password`,
  });

  if (error || !data.user) {
    console.error("Supabase Invite User Error:", error);
    
    // Provide a detailed error message for common admin key issues
    if (error?.status === 403 || error?.code === 'not_admin' || error?.message?.includes("not allowed")) {
      throw new Error(
        "Failed to invite user: Missing or invalid Supabase Service Role Key. " +
        "Ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in your .env file and is not the anon key."
      );
    }
    
    throw new Error(error?.message || "Failed to invite user.");
  }

  const invitedUserId = data.user.id;

  const emailLocalPart = email.split("@")[0] || "User";
  await db.insert(userProgress).values({
    userId: invitedUserId,
    userName: emailLocalPart,
    userImageSrc: "/edu-logo.png",
    role: "parent",
  }).onConflictDoNothing();

  const existingAdultLink = await db.query.familyGroupAdults.findFirst({
    where: eq(familyGroupAdults.userId, invitedUserId)
  });

  if (existingAdultLink) {
    if (existingAdultLink.familyGroupId !== group.id) {
       throw new Error("User is already in another family group.");
    }
    await db.update(familyGroupAdults)
      .set({ permissions })
      .where(eq(familyGroupAdults.id, existingAdultLink.id));
  } else {
    await db.insert(familyGroupAdults).values({
      familyGroupId: group.id,
      userId: invitedUserId,
      permissions,
      status: "pending",
    });
  }
  revalidatePath(`/${lang}/family`, 'layout');
};

export const removeFamilyAdult = async (adultId: string, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const group = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  if (!group) throw new Error("Only family group owners can remove adults.");

  await db.delete(familyGroupAdults).where(
    and(
      eq(familyGroupAdults.familyGroupId, group.id),
      eq(familyGroupAdults.userId, adultId)
    )
  );
  revalidatePath(`/${lang}/family`, 'layout');
};

export const updateAdultPermissions = async (adultId: string, permissions: any, lang: string = "en") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const group = await db.query.familyGroups.findFirst({
    where: eq(familyGroups.ownerId, userId),
  });
  if (!group) throw new Error("Only family group owners can modify permissions.");

  await db.update(familyGroupAdults)
    .set({ permissions })
    .where(
      and(
        eq(familyGroupAdults.familyGroupId, group.id),
        eq(familyGroupAdults.userId, adultId)
      )
    );
  revalidatePath(`/${lang}/family`, 'layout');
};

export const acceptFamilyInvite = async (targetUserId?: string) => {
  let userId = targetUserId;
  
  if (!userId) {
    const session = await auth();
    userId = session?.userId ?? undefined;
  }

  if (!userId) return;

  const adultLink = await db.query.familyGroupAdults.findFirst({
    where: eq(familyGroupAdults.userId, userId),
  });

  if (adultLink && adultLink.status === "pending") {
    await db.update(familyGroupAdults)
      .set({ status: "active" })
      .where(eq(familyGroupAdults.id, adultLink.id));
      
    revalidatePath(`/en/family`, "layout");
    revalidatePath(`/km/family`, "layout");
  }
};

export type FamilyMemberDetailResult = {
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

export const getFamilyMemberDetail = async (targetUserId: string): Promise<FamilyMemberDetailResult> => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Unauthorized");

  // 1. Check authorization: Same user or sharing a family group
  let isAuthorized = currentUserId === targetUserId;

  if (!isAuthorized) {
    const targetGroups = new Set<number>();
    
    // Find target's family group memberships
    const groupsOwnedByTarget = await db.query.familyGroups.findMany({
      where: eq(familyGroups.ownerId, targetUserId),
      columns: { id: true }
    });
    for (const g of groupsOwnedByTarget) targetGroups.add(g.id);

    const targetAdultLinks = await db.query.familyGroupAdults.findMany({
      where: eq(familyGroupAdults.userId, targetUserId),
      columns: { familyGroupId: true }
    });
    for (const link of targetAdultLinks) targetGroups.add(link.familyGroupId);

    const targetChildLinks = await db.query.familyGroupChildren.findMany({
      where: eq(familyGroupChildren.childId, targetUserId),
      columns: { familyGroupId: true }
    });
    for (const link of targetChildLinks) targetGroups.add(link.familyGroupId);

    if (targetGroups.size > 0) {
      // Find current user's family group memberships
      const currentUserGroups = new Set<number>();
      
      const groupsOwnedByCurrent = await db.query.familyGroups.findMany({
        where: eq(familyGroups.ownerId, currentUserId),
        columns: { id: true }
      });
      for (const g of groupsOwnedByCurrent) currentUserGroups.add(g.id);

      const currentUserAdultLinks = await db.query.familyGroupAdults.findMany({
        where: eq(familyGroupAdults.userId, currentUserId),
        columns: { familyGroupId: true }
      });
      for (const link of currentUserAdultLinks) currentUserGroups.add(link.familyGroupId);

      const currentUserChildLinks = await db.query.familyGroupChildren.findMany({
        where: eq(familyGroupChildren.childId, currentUserId),
        columns: { familyGroupId: true }
      });
      for (const link of currentUserChildLinks) currentUserGroups.add(link.familyGroupId);

      // Overlap check
      for (const gid of targetGroups) {
        if (currentUserGroups.has(gid)) {
          isAuthorized = true;
          break;
        }
      }
    }
  }

  if (!isAuthorized) {
    throw new Error("Unauthorized to view this family member's details.");
  }

  // 2. Fetch target user's details
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

  const result: FamilyMemberDetailResult = {
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
    isChild: !!childLink,
    parentName: childLink?.familyGroup?.owner?.userName ?? null,
    collectedBadges: progress.userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      icon: ub.badge.icon,
      description: ub.badge.description,
      earnedAt: ub.earnedAt.toISOString(),
    })),
  };

  if (progress.role === "parent") {
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
    }
  } else {
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

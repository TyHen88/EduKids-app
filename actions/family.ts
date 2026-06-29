"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userProgress, familyGroups, familyGroupAdults, familyGroupChildren, courseAssignments } from "@/db/schema";
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
    userImageSrc: "/mascot.svg",
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
    userImageSrc: "/mascot.svg",
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

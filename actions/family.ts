"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userProgress, familyMembers, courseAssignments } from "@/db/schema";
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

  // Link child to parent
  await db.insert(familyMembers).values({
    parentId: userId,
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
  const link = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.parentId, userId),
      eq(familyMembers.childId, childId)
    ),
  });

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

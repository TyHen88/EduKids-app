"use server";

import { auth, currentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { notifyAdmins } from "@/actions/notifications";

// Whether the currently signed-in user has a profile row in THIS database.
// Used to detect "orphaned identities" — e.g. a child that exists in the
// Supabase auth project but whose userProgress row lives in a different Neon
// database than the one currently configured.
export const hasUserProfile = async (): Promise<boolean> => {
  const { userId } = await auth();
  if (!userId) return false;

  const existing = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  return !!existing;
};

export const createUserWithRole = async (role: "learner" | "parent", lang: string = "en") => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error("Unauthorized.");

  // Check if user already has progress (shouldn't normally happen, but guard)
  const existing = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (existing) {
    // If they already have a row, just update the role
    await db
      .update(userProgress)
      .set({ role })
      .where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({
      userId,
      userName: user.firstName || "User",
      userImageSrc: user.imageUrl || "/mascot.svg",
      role,
    });

    // Alert admins about the new registration (in-app + web push). Fire-and-
    // forget: notifications must never block or delay onboarding.
    void notifyAdmins(
      "New user registered 🎉",
      `${user.firstName || "A new user"} just joined as a ${role}.`,
      `/${lang}/admin/students`
    ).catch((e) => console.error("notifyAdmins failed", e));
  }

  revalidatePath(`/${lang}/learn`);
  revalidatePath(`/${lang}/family`);
};

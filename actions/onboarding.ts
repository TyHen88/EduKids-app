"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";

// Whether the currently signed-in Clerk user has a profile row in THIS
// database. Used to detect "orphaned identities" — e.g. a child that exists in
// the shared Clerk instance but whose userProgress row lives in a different
// Neon database than the one currently configured.
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
  }

  revalidatePath(`/${lang}/learn`);
  revalidatePath(`/${lang}/family`);
};

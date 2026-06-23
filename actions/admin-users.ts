"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

/**
 * Activate or deactivate a user. Enforcement is app-level: deactivated users
 * keep their Clerk session but every authenticated layout redirects them to the
 * /deactivated page (see lib/guard.ts). We intentionally do NOT ban them in
 * Clerk — banning revokes the session and bounces them through Clerk's hosted
 * Account Portal, which we want to avoid.
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

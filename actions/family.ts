"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userProgress, familyMembers, courseAssignments } from "@/db/schema";
import { MAX_HEARTS } from "@/constants";

export const createChildAccount = async (
  name: string,
  username: string,
  pin: string,
  lang: string = "en"
) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  // Create user in Clerk
  let childUser;
  try {
    const securePassword = `${pin}-EduKids-Secret-Pin-!`;
    
    childUser = await (await clerkClient()).users.createUser({
      firstName: name,
      username: username,
      emailAddress: [`${username}@dummy.edukids.com`],
      password: securePassword,
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });
  } catch (error: any) {
    console.error("Clerk Create User Error:", JSON.stringify(error, null, 2));
    if (error.errors && error.errors.length > 0) {
      throw new Error(`Clerk Error: ${error.errors[0].message}`);
    }
    throw error;
  }

  const childId = childUser.id;

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

  // Delete from Clerk
  try {
    await (await clerkClient()).users.deleteUser(childId);
  } catch (error) {
    console.error("Error deleting user from Clerk:", error);
  }

  // Delete family link and progress (progress deletes automatically due to cascade, but good to be explicit)
  await db.delete(userProgress).where(eq(userProgress.userId, childId));

  revalidatePath(`/${lang}/family/children`);
  revalidatePath(`/${lang}/family`);
};

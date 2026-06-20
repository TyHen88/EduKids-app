"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";

export type ProfileInput = {
  userName: string;
  userImageSrc: string;
  buddyName: string;
  familyName?: string;
  familyCover?: string;
  familyMotto?: string;
};

export const updateProfile = async (data: ProfileInput, lang = "km") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized.");

  const values = {
    userName: data.userName.trim() || "Explorer",
    userImageSrc: data.userImageSrc.trim() || "/mascot.svg",
    buddyName: data.buddyName.trim() || "Cosmo",
    familyName: data.familyName?.trim() || "My Family",
    familyCover: data.familyCover || "emerald",
    familyMotto: data.familyMotto?.trim() || "",
  };

  await db
    .insert(userProgress)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: userProgress.userId, set: values });

  revalidatePath(`/${lang}/profile`);
  revalidatePath(`/${lang}/learn`);
};

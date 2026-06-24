"use server";

import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { auth, currentUser } from "@/lib/auth";
import { loginAudit, userProgress } from "@/db/schema";

type AuditEvent =
  | "login"
  | "logout"
  | "signup"
  | "create_child"
  | "change_password";

/**
 * Insert one audit row. Best-effort: any failure (e.g. the table not existing
 * before `db:push`) is logged, never thrown, so it can't break the user flow.
 * userName/role are snapshotted from the profile if one exists; otherwise we
 * fall back to `fallbackName` (e.g. the email) so brand-new users aren't logged
 * as "Unknown".
 */
const insertAudit = async (params: {
  userId: string;
  event: AuditEvent;
  loginType?: string | null;
  reason?: string | null;
  fallbackName?: string | null;
}) => {
  try {
    const profile = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, params.userId),
      columns: { userName: true, role: true },
    });

    await db.insert(loginAudit).values({
      userId: params.userId,
      userName: profile?.userName ?? params.fallbackName ?? null,
      role: profile?.role ?? null,
      event: params.event,
      loginType: params.loginType ?? null,
      reason: params.reason ?? null,
    });
  } catch (error) {
    console.error("Failed to record audit event (did you run db:push?)", error);
  }
};

/** Email/password (sign-in) or PIN (kids) — current session user. */
export const recordLogin = async (loginType: "email" | "google" | "pin") => {
  const user = await currentUser();
  if (!user) return;
  await insertAudit({
    userId: user.id,
    event: "login",
    loginType,
    reason: `Signed in with ${loginType}`,
    fallbackName: user.email ?? user.firstName ?? null,
  });
};

/**
 * OAuth / email-confirmation callback. Records a `signup` for brand-new users
 * (no profile row yet) and a `login` for returning ones, with the correct
 * method (email-confirmation vs Google).
 */
export const recordAuthCallback = async (
  userId: string,
  loginType: "email" | "google",
  email?: string | null
) => {
  try {
    const profile = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { userName: true, role: true },
    });
    const isNew = !profile;
    await db.insert(loginAudit).values({
      userId,
      userName: profile?.userName ?? email ?? null,
      role: profile?.role ?? null,
      event: isNew ? "signup" : "login",
      loginType,
      reason: isNew
        ? `Registered with ${loginType}`
        : `Signed in with ${loginType}`,
    });
  } catch (error) {
    console.error("Failed to record auth callback audit", error);
  }
};

export const recordLogout = async () => {
  const { userId } = await auth();
  if (!userId) return;
  await insertAudit({ userId, event: "logout", reason: "Signed out" });
};

export const recordCreateChild = async (childName: string) => {
  const { userId } = await auth();
  if (!userId) return;
  await insertAudit({
    userId,
    event: "create_child",
    reason: `Created child account: ${childName}`,
  });
};

export const recordPasswordChange = async () => {
  const { userId } = await auth();
  if (!userId) return;
  await insertAudit({
    userId,
    event: "change_password",
    reason: "Changed password",
  });
};

import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { ParentShell } from "@/components/parent-shell";
import { ToolsAssist } from "@/components/tools/tools-assist";
import {
  getUserProgress,
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/db/queries";

type ParentLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const ParentLayout = async ({ children, params }: ParentLayoutProps) => {
  const { lang } = await params;
  const { userId } = await auth();

  if (!userId) redirect(`/${lang}`);

  const userProgress = await getUserProgress();

  if (!userProgress) redirect(`/${lang}/onboarding`);

  // Deactivated users are blocked from the app
  if (!userProgress.isActive) redirect(`/${lang}/deactivated`);

  if (userProgress.role !== "parent") redirect(`/${lang}/learn`);

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <ParentShell
      userId={userId}
      userImageSrc={userProgress?.userImageSrc || "/edu-logo.png"}
      userName={userProgress?.userName || "Parent"}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
      <ToolsAssist />
    </ParentShell>
  );
};

export default ParentLayout;

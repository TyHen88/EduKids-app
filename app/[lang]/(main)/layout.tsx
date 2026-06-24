import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { MainShell } from "@/components/main-shell";
import { getIsAdmin } from "@/lib/admin";
import { getUserProgress, getUserNotifications, getUnreadNotificationCount, getIsChild } from "@/db/queries";
import { PushNotificationManager } from "@/components/push-notification-manager";

type MainLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const { lang } = await params;
  const { userId } = await auth();

  if (!userId) redirect(`/${lang}`);

  const userProgress = await getUserProgress();

  // New user with no profile → onboarding
  if (!userProgress) redirect(`/${lang}/onboarding`);

  // Deactivated users are blocked from the app
  if (!userProgress.isActive) redirect(`/${lang}/deactivated`);

  // Parent users should use the parent dashboard
  if (userProgress.role === "parent") redirect(`/${lang}/family`);

  // Admins (userId in ADMIN_IDS) belong in the admin panel.
  if (await getIsAdmin()) redirect(`/${lang}/admin`);

  const [isAdmin, notifications, unreadCount, isChild] = await Promise.all([
    getIsAdmin(),
    getUserNotifications(),
    getUnreadNotificationCount(),
    getIsChild(),
  ]);

  return (
    <>
      <PushNotificationManager />
      <MainShell
        userId={userId}
        points={userProgress?.points ?? 0}
        hearts={userProgress?.hearts ?? 0}
        streak={userProgress?.streak ?? 0}
        isAdmin={isAdmin}
        userImageSrc={userProgress?.userImageSrc || "/mascot.svg"}
        userName={userProgress?.userName || "Explorer"}
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
        isChild={isChild}
        hasActiveCourse={!!userProgress?.activeCourseId}
      >
        {children}
      </MainShell>
    </>
  );
};

export default MainLayout;

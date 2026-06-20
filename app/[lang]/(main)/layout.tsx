import type { ReactNode } from "react";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { MainShell } from "@/components/main-shell";
import { getIsAdmin } from "@/lib/admin";
import { getUserProgress, getUserNotifications, getUnreadNotificationCount } from "@/db/queries";
import { PushNotificationManager } from "@/components/push-notification-manager";

type MainLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const { lang } = await params;
  const { userId } = await auth();

  if (!userId) redirect(`/${lang}`);

  const [userProgress, isAdmin, notifications, unreadCount] = await Promise.all([
    getUserProgress(),
    getIsAdmin(),
    getUserNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <>
      <PushNotificationManager />
      <MainShell
        points={userProgress?.points ?? 0}
        hearts={userProgress?.hearts ?? 0}
        streak={userProgress?.streak ?? 0}
        isAdmin={isAdmin}
        userImageSrc={userProgress?.userImageSrc || "/mascot.svg"}
        userName={userProgress?.userName || "Explorer"}
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      >
        {children}
      </MainShell>
    </>
  );
};

export default MainLayout;

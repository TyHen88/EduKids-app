import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-sidebar";
import { getIsAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/db/queries";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const AdminLayout = async ({ children, params }: AdminLayoutProps) => {
  const { lang } = await params;
  const isAdmin = await getIsAdmin();

  if (!isAdmin) redirect(`/${lang}/learn`);

  const [{ userId }, notifications, unreadCount] = await Promise.all([
    auth(),
    getUserNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <AdminShell
      userId={userId ?? ""}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  );
};

export default AdminLayout;

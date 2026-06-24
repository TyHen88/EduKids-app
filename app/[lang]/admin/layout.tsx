import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-sidebar";
import { getIsAdmin } from "@/lib/admin";
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

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <AdminShell
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  );
};

export default AdminLayout;

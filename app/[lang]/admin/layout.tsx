import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-sidebar";
import { getIsAdmin } from "@/lib/admin";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const AdminLayout = async ({ children, params }: AdminLayoutProps) => {
  const { lang } = await params;
  const isAdmin = await getIsAdmin();

  if (!isAdmin) redirect(`/${lang}/learn`);

  return <AdminShell>{children}</AdminShell>;
};

export default AdminLayout;

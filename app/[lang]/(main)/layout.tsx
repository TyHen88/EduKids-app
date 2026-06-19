import type { ReactNode } from "react";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { MainShell } from "@/components/main-shell";
import { getIsAdmin } from "@/lib/admin";
import { getUserProgress } from "@/db/queries";

type MainLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const { lang } = await params;
  const { userId } = await auth();

  if (!userId) redirect(`/${lang}`);

  const [userProgress, isAdmin] = await Promise.all([
    getUserProgress(),
    getIsAdmin(),
  ]);

  return (
    <MainShell
      points={userProgress?.points ?? 0}
      hearts={userProgress?.hearts ?? 0}
      streak={userProgress?.streak ?? 0}
      isAdmin={isAdmin}
      userImageSrc={userProgress?.userImageSrc || "/mascot.svg"}
      userName={userProgress?.userName || "Explorer"}
    >
      {children}
    </MainShell>
  );
};

export default MainLayout;

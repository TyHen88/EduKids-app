import type { ReactNode } from "react";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ParentShell } from "@/components/parent-shell";
import { getUserProgress } from "@/db/queries";

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

  return (
    <ParentShell
      userImageSrc={userProgress?.userImageSrc || "/mascot.svg"}
      userName={userProgress?.userName || "Parent"}
    >
      {children}
    </ParentShell>
  );
};

export default ParentLayout;

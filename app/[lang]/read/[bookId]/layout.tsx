import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { guardActiveUser } from "@/lib/guard";

// Full-screen reader shell (outside the student MainShell), like the lesson
// player — no nav/stats while reading.
const ReadLayout = async ({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/${lang}`);
  await guardActiveUser(lang);

  return <div className="flex h-dvh flex-col bg-slate-900">{children}</div>;
};

export default ReadLayout;

import type { ReactNode } from "react";

import { guardActiveUser } from "@/lib/guard";

const LessonLayout = async ({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  // Block deactivated users from the lesson player too.
  await guardActiveUser(lang);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-full w-full flex-col">{children}</div>
    </div>
  );
};

export default LessonLayout;

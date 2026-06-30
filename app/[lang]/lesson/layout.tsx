import type { ReactNode } from "react";

import { guardActiveUser } from "@/lib/guard";
import { getAudioSettings } from "@/db/queries";
import { ButtonClickSound } from "@/components/button-click-sound";

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

  // The lesson player is outside the (main) shell, so wire the button click
  // sound here too (gated by the admin's global audio switch).
  const audio = await getAudioSettings();

  return (
    <div className="flex h-full flex-col">
      <ButtonClickSound enabled={audio.musicEnabled} />
      <div className="flex h-full w-full flex-col">{children}</div>
    </div>
  );
};

export default LessonLayout;

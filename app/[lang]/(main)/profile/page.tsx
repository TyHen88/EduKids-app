import { currentUser } from "@clerk/nextjs/server";

import { getUserBadges, getUserProgress } from "@/db/queries";

import { ProfileEditor } from "./profile-editor";

type Props = {
  params: Promise<{ lang: string }>;
};

const ProfilePage = async ({ params }: Props) => {
  await params;

  const [userProgress, userBadges, user] = await Promise.all([
    getUserProgress(),
    getUserBadges(),
    currentUser(),
  ]);

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <ProfileEditor
      initialName={userProgress?.userName || user?.firstName || "Explorer"}
      initialImage={userProgress?.userImageSrc || "/mascot.svg"}
      initialBuddyName={userProgress?.buddyName || "Cosmo"}
      email={email}
      points={userProgress?.points ?? 0}
      streak={userProgress?.streak ?? 0}
      hearts={userProgress?.hearts ?? 0}
      buddyXp={userProgress?.buddyXp ?? 0}
      badges={userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        icon: ub.badge.icon,
      }))}
    />
  );
};

export default ProfilePage;

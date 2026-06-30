import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

import { getUserProgress } from "@/db/queries";

import { ParentProfileEditor } from "./parent-profile-editor";

type Props = {
  params: Promise<{ lang: string }>;
};

const ParentProfilePage = async ({ params }: Props) => {
  const { lang } = await params;

  const [userProgress, user] = await Promise.all([
    getUserProgress(),
    currentUser(),
  ]);

  if (!userProgress || userProgress.role !== "parent") {
    redirect(`/${lang}/learn`);
  }

  const email = user?.email ?? "";

  return (
    <ParentProfileEditor
      initialName={userProgress.userName || user?.firstName || "Parent"}
      initialImage={userProgress.userImageSrc || "/edu-logo.png"}
      email={email}
      initialFamilyName={userProgress.familyName}
      initialFamilyCover={userProgress.familyCover}
      initialFamilyMotto={userProgress.familyMotto}
    />
  );
};

export default ParentProfilePage;

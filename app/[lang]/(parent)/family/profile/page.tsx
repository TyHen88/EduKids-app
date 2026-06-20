import { currentUser } from "@clerk/nextjs/server";
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

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <ParentProfileEditor
      initialName={userProgress.userName || user?.firstName || "Parent"}
      initialImage={userProgress.userImageSrc || "/mascot.svg"}
      email={email}
    />
  );
};

export default ParentProfilePage;

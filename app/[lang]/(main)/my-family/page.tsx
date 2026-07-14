import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { familyGroupChildren } from "@/db/schema";
import { getTopFriends, getIsChild } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { FamilyClient } from "./family-client";

type Props = {
  params: Promise<{ lang: string }>;
};

const MyFamilyPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");

  const [topFriends, isChild, { userId }] = await Promise.all([
    getTopFriends(),
    getIsChild(),
    auth(),
  ]);

  if (!isChild || !userId) {
    redirect(`/${lang}/friends`);
  }

  // Fetch child's family group details
  const childLink = await db.query.familyGroupChildren.findFirst({
    where: eq(familyGroupChildren.childId, userId),
    with: {
      familyGroup: true,
    },
  });

  const familyInfo = {
    name: childLink?.familyGroup?.name || dict["myFamily.title"] || "My Family",
    motto: childLink?.familyGroup?.motto || null,
    cover: childLink?.familyGroup?.cover || "emerald",
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">
      <FamilyClient
        initialMembers={topFriends}
        familyInfo={familyInfo}
        dict={dict as Record<string, string>}
      />
    </div>
  );
};

export default MyFamilyPage;

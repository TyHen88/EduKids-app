import { getChildren, getFamilyGroupDetails } from "@/db/queries";
import { ChildrenClient } from "./children-client";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ lang: string }>;
};

const ChildrenPage = async ({ params }: Props) => {
  const { lang } = await params;
  const { userId } = await auth();
  
  const [children, familyGroup] = await Promise.all([
    getChildren(),
    getFamilyGroupDetails(),
  ]);
  
  let canManage = false;
  if (!familyGroup) {
    canManage = true;
  } else if (familyGroup.ownerId === userId) {
    canManage = true;
  } else {
    const adultLink = familyGroup.adults.find((a) => a.userId === userId);
    if (adultLink?.permissions && (adultLink.permissions as any).manage) {
      canManage = true;
    }
  }

  return <ChildrenClient initialChildren={children} lang={lang} canManage={canManage} />;
};

export default ChildrenPage;

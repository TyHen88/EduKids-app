import { getChildren, getFamilyGroupDetails } from "@/db/queries";
import { ChildrenClient } from "./children-client";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/family-permissions";

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

  let canCreate = false;
  let canEdit = false;

  if (!familyGroup || familyGroup.ownerId === userId) {
    canCreate = true;
    canEdit = true;
  } else {
    const adultLink = familyGroup.adults.find((a) => a.userId === userId);
    if (adultLink?.permissions) {
      canCreate = hasPermission(adultLink.permissions as any, "createChild");
      canEdit = hasPermission(adultLink.permissions as any, "editChild");
    }
  }

  return (
    <ChildrenClient
      initialChildren={children}
      lang={lang}
      canCreate={canCreate}
      canEdit={canEdit}
      canManage={canCreate || canEdit}
    />
  );
};

export default ChildrenPage;

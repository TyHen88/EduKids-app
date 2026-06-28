import { redirect } from "next/navigation";
import { getUserProgress, getFamilyGroupDetails } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { AdultManager } from "@/components/family/adult-manager";

type Props = {
  params: Promise<{ lang: string }>;
};

const FamilyMembersPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const [userProgress, familyGroup] = await Promise.all([
    getUserProgress(),
    getFamilyGroupDetails(),
  ]);

  if (!userProgress) {
    redirect(`/${lang}/sign-in`);
  }

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-800">
          {dict["nav.members"] || "Members"}
        </h1>
        <p className="mt-2 text-sm sm:text-base font-semibold text-slate-500">
          Manage the adults in your family group.
        </p>
      </div>

      {familyGroup ? (
        <AdultManager 
          isOwner={familyGroup.ownerId === userProgress.userId}
          ownerId={familyGroup.ownerId}
          currentUserId={userProgress.userId}
          adults={[
            {
              id: 0,
              userId: familyGroup.ownerId,
              status: "active",
              permissions: { manage: true, view: true },
              user: familyGroup.owner,
            },
            ...familyGroup.adults,
          ]}
          lang={lang}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <h3 className="mb-2 text-xl font-bold text-slate-700">
            No family group found
          </h3>
          <p className="mb-6 max-w-sm text-slate-500">
            You are not part of a family group yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default FamilyMembersPage;

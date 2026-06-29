import Image from "next/image";
import { redirect } from "next/navigation";
import { Users, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { getTopFriends, getIsChild } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

type Props = {
  params: Promise<{ lang: string }>;
};

const MyFamilyPage = async ({ params }: Props) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");

  const [topFriends, isChild] = await Promise.all([
    getTopFriends(),
    getIsChild(),
  ]);

  if (!isChild) {
    redirect(`/${lang}/friends`);
  }

  // A family group can have multiple adults (owner + co-parents), all with role
  // "parent". Group every adult under "Parents"; only learners are siblings.
  const parents = topFriends.filter((u) => u.role === "parent");
  const siblings = topFriends.filter((u) => u.role !== "parent");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-800">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />{" "}
          {dict["myFamily.title"] || "My Family"}
        </h1>
      </div>

      <div className="space-y-6">
        {parents.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400 pl-2">
              {parents.length > 1
                ? dict["myFamily.parents"] || "Parents"
                : dict["myFamily.parent"] || "Parent"}
            </h2>
            <div className="flex flex-col gap-4">
              {parents.map((parent) => (
                <div
                  key={parent.userId}
                  className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 shadow-sm">
                      <Image
                        src={parent.userImageSrc}
                        alt={parent.userName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{parent.userName}</h3>
                      <div className="mt-1 text-xs font-black uppercase tracking-widest text-indigo-500">
                        {dict["myFamily.familyManager"] || "Family Manager"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {siblings.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400 pl-2">
              {dict["myFamily.siblings"] || "Siblings"}
            </h2>
            <div className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                {siblings.map((sibling) => (
                  <div
                    key={sibling.userId}
                    className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                      <Image
                        src={sibling.userImageSrc}
                        alt={sibling.userName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{sibling.userName}</h4>
                      <div className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {dict["myFamily.explorer"] || "Explorer"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {topFriends.length === 0 && (
          <div className="rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-xl font-bold text-slate-700">
              {dict["myFamily.noFamilyLinked"] || "No family linked yet!"}
            </h3>
            <p className="text-sm font-medium">
              {dict["myFamily.noFamilyHint"] ||
                "Ask your parents to link your account to theirs."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFamilyPage;

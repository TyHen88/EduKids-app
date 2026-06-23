import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Ban } from "lucide-react";

import { getUserProgress } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";

import { DeactivatedSignOut } from "./sign-out-button";

const DeactivatedPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");

  const { userId } = await auth();
  if (!userId) redirect(`/${lang}`);

  // Active users have no business here — send them back into the app.
  const userProgress = await getUserProgress();
  if (userProgress?.isActive) redirect(`/${lang}/learn`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-[32px] border-2 border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Ban className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
          {dict["deactivated.title"] || "Account deactivated"}
        </h1>
        <p className="mt-3 text-base text-slate-500">
          {dict["deactivated.message"] ||
            "Your account has been deactivated by an administrator. Please contact support if you think this is a mistake."}
        </p>
        <div className="mt-8">
          <DeactivatedSignOut />
        </div>
      </div>
    </div>
  );
};

export default DeactivatedPage;

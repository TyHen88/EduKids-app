import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { currentUser } from "@/lib/auth";
import { getUserProgress, getIsChild } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { SettingsForm } from "@/components/settings/settings-form";

// Learner settings — rendered inside the student MainShell (nav stays visible).
const SettingsPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");

  const [progress, isChild, user] = await Promise.all([
    getUserProgress(),
    getIsChild(),
    currentUser(),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/profile`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-500 transition-colors hover:text-indigo-600"
          aria-label={dict["settings.backToProfile"] || "Back to profile"}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            {dict["settings.title"] || "Settings"}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {dict["settings.subtitle"] || "Manage your account and preferences."}
          </p>
        </div>
      </div>

      <SettingsForm
        lang={lang}
        email={user?.email ?? ""}
        isChild={isChild}
        notificationsEnabled={progress?.notificationsEnabled ?? true}
        passwordSet={progress?.passwordSet ?? false}
      />
    </div>
  );
};

export default SettingsPage;

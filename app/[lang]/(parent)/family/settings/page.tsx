import { currentUser } from "@/lib/auth";
import { getUserProgress, getIsChild } from "@/db/queries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { SettingsForm } from "@/components/settings/settings-form";

// Parent settings — rendered inside the ParentShell (nav stays visible).
const ParentSettingsPage = async ({
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
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          {dict["settings.title"] || "Settings"}
        </h1>
        <p className="text-sm font-medium text-slate-500">
          {dict["settings.subtitle"] || "Manage your account and preferences."}
        </p>
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

export default ParentSettingsPage;

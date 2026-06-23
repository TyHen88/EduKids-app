import Image from "next/image";
import { currentUser } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";
import { Heart, Coins, Globe, ShieldCheck, Settings as Cog } from "lucide-react";

import { MAX_HEARTS, POINTS_TO_REFILL } from "@/constants";
import {
  locales,
  defaultLocale,
  getDictionary,
} from "@/app/[lang]/dictionaries";
import { LanguageSwitcher } from "@/components/language-switcher";

const AdminSettingsPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  const { lang } = await params;
  const dict = await getDictionary(lang as "km" | "en");
  const user = await currentUser();

  const adminCount =
    process.env.ADMIN_IDS?.split(", ").filter(Boolean).length ?? 0;

  const name =
    user?.firstName || dict["admin.adminBadge"] || "Admin";
  const email = user?.email ?? "—";

  const configRows = [
    {
      icon: Heart,
      color: "text-rose-500",
      label: dict["admin.maxHearts"] || "Max hearts",
      value: MAX_HEARTS,
    },
    {
      icon: Coins,
      color: "text-indigo-600",
      label: dict["admin.pointsToRefill"] || "Points to refill hearts",
      value: POINTS_TO_REFILL,
    },
    {
      icon: Globe,
      color: "text-emerald-600",
      label: dict["admin.locales"] || "Locales",
      value: locales.join(", "),
    },
    {
      icon: Globe,
      color: "text-emerald-600",
      label: dict["admin.defaultLocale"] || "Default locale",
      value: defaultLocale,
    },
    {
      icon: ShieldCheck,
      color: "text-purple-600",
      label: dict["admin.adminAccounts"] || "Admin accounts",
      value: adminCount,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {dict["admin.settings"] || "Settings"}
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            {dict["admin.settingsSubtitle"] ||
              "Your account and platform configuration."}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-600 sm:flex">
          <Cog className="h-7 w-7" />
        </div>
      </div>

      {/* Account */}
      <section className="rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-bold tracking-tight text-slate-800">
          {dict["admin.account"] || "Account"}
        </h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : null}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-800">{name}</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                  {dict["admin.adminBadge"] || "Admin"}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-500">{email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500">
              {dict["admin.manageAccount"] || "Manage account"}
            </span>
            <UserMenu />
          </div>
        </div>
      </section>

      {/* Language preference */}
      <section className="rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-lg font-bold tracking-tight text-slate-800">
          {dict["admin.language"] || "Language"}
        </h2>
        <p className="mb-5 text-sm font-medium text-slate-500">
          {dict["admin.languageSubtitle"] ||
            "Switch the interface language for the current session."}
        </p>
        <LanguageSwitcher />
      </section>

      {/* Platform config */}
      <section className="rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-bold tracking-tight text-slate-800">
          {dict["admin.platformConfiguration"] || "Platform configuration"}
        </h2>
        <div className="divide-y divide-slate-100">
          {configRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <row.icon className={`h-5 w-5 ${row.color}`} />
                <span className="font-bold text-slate-700">{row.label}</span>
              </div>
              <span className="font-black text-slate-800">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs font-medium text-slate-400">
          {dict["admin.gameplayConstantsLiveIn"] || "Gameplay constants live in"}{" "}
          <code>constants.ts</code>.{" "}
          {dict["admin.adminAccountsConfiguredVia"] ||
            "Admin accounts are configured via the"}{" "}
          <code>ADMIN_IDS</code>{" "}
          {dict["admin.environmentVariable"] || "environment variable."}
        </p>
      </section>
    </div>
  );
};

export default AdminSettingsPage;

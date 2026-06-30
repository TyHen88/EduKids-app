"use client";

import { useEffect, useState } from "react";
import { Bell, Volume2, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { setNotificationsEnabled, markPasswordSet } from "@/actions/settings";
import { recordPasswordChange } from "@/actions/audit";
import { useDictionary } from "@/app/[lang]/lang-provider";
import { useMusic } from "@/store/use-music";

type Props = {
  lang: string;
  email: string;
  isChild: boolean;
  notificationsEnabled: boolean;
  passwordSet: boolean;
  // Whether to show the background-music on/off control. The student app passes
  // the admin's global setting here — when the admin has music off there's
  // nothing to toggle, so the control is hidden. Other shells (parent/admin)
  // don't play music, so they leave this off.
  showMusicToggle?: boolean;
};

/**
 * The settings cards (password, notifications, sound). Renders content only —
 * no page header/background — so it can be dropped inside any role's shell
 * (main/parent/admin) instead of a standalone full-screen page.
 */
export const SettingsForm = ({
  lang,
  email,
  isChild,
  notificationsEnabled,
  passwordSet,
  showMusicToggle = false,
}: Props) => {
  const dict = useDictionary();

  // Background-music on/off — the learner's own preference, shared with the
  // header music toggle via the persisted store.
  const musicOn = useMusic((state) => state.enabled);
  const setMusicEnabled = useMusic((state) => state.setEnabled);

  // Whether this account has an email/password identity (detected from the
  // auth providers). null = still detecting.
  const [hasEmailProvider, setHasEmailProvider] = useState<boolean | null>(null);
  // True once a password has been set via the app (persisted, OR'd in below) —
  // covers OAuth users who set one, which providers can't tell us.
  const [passwordSetLocal, setPasswordSetLocal] = useState(passwordSet);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [notifyOn, setNotifyOn] = useState(notificationsEnabled);

  // Avoid a hydration mismatch: the persisted music pref isn't known on the
  // server, so render the default (on) until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const soundOn = mounted ? musicOn : true;

  // true = has a password, false = doesn't, null = still detecting.
  const hasPassword: boolean | null = passwordSetLocal
    ? true
    : hasEmailProvider;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Look at both app_metadata.providers and the identities list — either
      // listing an "email" provider means an email/password identity exists.
      const fromMeta =
        (user?.app_metadata?.providers as string[] | undefined) ??
        (user?.app_metadata?.provider
          ? [user.app_metadata.provider as string]
          : []);
      const fromIdentities = (user?.identities ?? []).map((i) => i.provider);
      const providers = new Set([...fromMeta, ...fromIdentities]);
      setHasEmailProvider(providers.has("email"));
    });
  }, []);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(
        dict["settings.passwordTooShort"] ||
          "Password must be at least 6 characters."
      );
      return;
    }

    setPwLoading(true);
    const supabase = createClient();
    try {
      // For email/password accounts, re-verify the current password first.
      if (hasPassword) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (verifyErr) {
          toast.error(
            dict["settings.currentPasswordWrong"] ||
              "Current password is incorrect."
          );
          setPwLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast.error(
          dict["settings.passwordError"] || "Couldn't update your password."
        );
        setPwLoading(false);
        return;
      }

      void recordPasswordChange().catch(() => {});
      void markPasswordSet().catch(() => {});
      toast.success(dict["settings.passwordSaved"] || "Password saved!");
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSetLocal(true); // they now have a password
    } catch {
      toast.error(
        dict["settings.passwordError"] || "Couldn't update your password."
      );
    } finally {
      setPwLoading(false);
    }
  };

  const onToggleNotifications = (next: boolean) => {
    setNotifyOn(next); // optimistic
    setNotificationsEnabled(next, lang)
      .then(() =>
        toast.success(
          next
            ? dict["settings.notifyOnToast"] || "Notifications on"
            : dict["settings.notifyOffToast"] || "Notifications off"
        )
      )
      .catch(() => {
        setNotifyOn(!next); // revert
        toast.error(dict["common.somethingWentWrong"] || "Something went wrong.");
      });
  };

  const onToggleSound = (next: boolean) => {
    setMusicEnabled(next); // persisted store, shared with the header toggle
  };

  return (
    <div className="space-y-6">
      {/* Password */}
      <section className="rounded-[28px] border-2 border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">
            {hasPassword === false
              ? dict["settings.setPassword"] || "Set a password"
              : dict["settings.passwordTitle"] || "Password"}
          </h2>
        </div>

        {isChild ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">
            {dict["settings.childPasswordNote"] ||
              "Your login PIN is managed by your parent."}
          </p>
        ) : (
          <form onSubmit={onChangePassword} className="space-y-4">
            {hasPassword === false && (
              <p className="rounded-2xl bg-indigo-50 p-3 text-sm font-medium text-indigo-700">
                {dict["settings.setPasswordHint"] ||
                  "You signed in with Google. Set a password to also sign in with your email."}
              </p>
            )}

            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">
                  {dict["settings.currentPassword"] || "Current password"}
                </Label>
                <PasswordInput
                  id="currentPassword"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-2xl border-2 border-slate-200 focus-visible:ring-indigo-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">
                {dict["settings.newPassword"] || "New password"}
              </Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={
                  dict["auth.atLeast8Characters"] || "At least 8 characters"
                }
                className="rounded-2xl border-2 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={pwLoading || hasPassword === null}
            >
              {pwLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : hasPassword === false ? (
                dict["settings.setPassword"] || "Set password"
              ) : (
                dict["settings.updatePassword"] || "Update password"
              )}
            </Button>
          </form>
        )}
      </section>

      {/* Notifications */}
      <section className="rounded-[28px] border-2 border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {dict["settings.notificationsTitle"] || "Notifications"}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {dict["settings.notificationsDesc"] ||
                  "Get push alerts for friend requests and rewards."}
              </p>
            </div>
          </div>
          <Switch
            checked={notifyOn}
            onCheckedChange={onToggleNotifications}
            aria-label={dict["settings.notificationsTitle"] || "Notifications"}
          />
        </div>
      </section>

      {/* Background music on/off. Only shown when the admin has music enabled
          globally (otherwise there's nothing to control). */}
      {showMusicToggle && (
        <section className="rounded-[28px] border-2 border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Volume2 className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {dict["settings.soundTitle"] || "Music"}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {dict["settings.soundDesc"] || "Play background music."}
                </p>
              </div>
            </div>
            <Switch
              checked={soundOn}
              onCheckedChange={onToggleSound}
              aria-label={dict["settings.soundTitle"] || "Music"}
            />
          </div>
        </section>
      )}
    </div>
  );
};

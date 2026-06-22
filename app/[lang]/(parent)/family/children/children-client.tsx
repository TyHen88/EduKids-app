"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  UserPlus,
  Loader2,
  Trash2,
  ShieldAlert,
  Star,
  Flame,
  Heart,
  BookOpen,
  AtSign,
  Copy,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { createChildAccount, removeChildAccount } from "@/actions/family";
import { useDictionary } from "@/app/[lang]/lang-provider";

type Child = {
  userId: string;
  userName: string;
  userImageSrc: string;
  username: string | null;
  points: number;
  streak: number;
  hearts: number;
  totalSeconds: number;
  activeCourse?: { title: string } | null;
};

type ChildrenClientProps = {
  initialChildren: Child[];
  lang: string;
};

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

export const ChildrenClient = ({ initialChildren, lang }: ChildrenClientProps) => {
  const dict = useDictionary();
  const [children] = useState(initialChildren);
  const [isPending, startTransition] = useTransition();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    pin: "",
  });

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length !== 4 || isNaN(Number(formData.pin))) {
      toast.error(dict["parent.pinMustBe4Digits"] || "PIN must be exactly 4 digits");
      return;
    }

    startTransition(async () => {
      try {
        await createChildAccount(formData.name, formData.username, formData.pin, lang);
        toast.success(dict["parent.accountCreated"] || "Child account created successfully!");
        setIsAdding(false);
        setFormData({ name: "", username: "", pin: "" });
        window.location.reload(); // refresh server data
      } catch (error: any) {
        toast.error(error.message || dict["parent.failedToCreate"] || "Failed to create account. Username might be taken.");
      }
    });
  };

  const handleRemoveChild = async (childId: string) => {
    if (!confirm(dict["parent.confirmRemoveChild"] || "Are you sure you want to completely remove this child account? This cannot be undone.")) return;

    startTransition(async () => {
      try {
        await removeChildAccount(childId, lang);
        toast.success(dict["parent.childRemoved"] || "Child account removed.");
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || dict["parent.failedToRemove"] || "Failed to remove child.");
      }
    });
  };

  const copyUsername = (username: string) => {
    navigator.clipboard
      .writeText(username)
      .then(() => toast.success(dict["parent.usernameCopied"] || "Username copied"))
      .catch(() => toast.error(dict["parent.couldntCopy"] || "Couldn't copy"));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {dict["parent.manageChildren"] || "Manage Children"}
            {children.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-black text-emerald-700">
                {children.length}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {dict["parent.createManageProfiles"] || "Create and manage profiles for your kids."}
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="rounded-xl border-b-4 border-emerald-800 bg-emerald-600 font-bold text-white hover:bg-emerald-700 active:translate-y-1 active:border-b-0"
          >
            <UserPlus className="mr-2 h-5 w-5" /> {dict["parent.addChild"] || "Add Child"}
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-3xl border-2 border-b-4 border-emerald-100 border-b-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-800">{dict["parent.createNewProfile"] || "Create New Profile"}</h2>
          <form onSubmit={handleAddChild} className="max-w-md space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{dict["parent.displayName"] || "Display Name"}</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={dict["parent.displayNamePlaceholder"] || "e.g. Leo"}
                className="h-12 rounded-xl border-2 bg-slate-50 px-4"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{dict["parent.uniqueUsername"] || "Unique Username"}</label>
              <Input
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={dict["parent.usernamePlaceholder"] || "e.g. leo2026"}
                className="h-12 rounded-xl border-2 bg-slate-50 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-bold text-slate-700">
                {dict["parent.loginPin"] || "4-Digit Login PIN"}
              </Label>
              <div className="flex justify-start">
                <InputOTP
                  maxLength={4}
                  value={formData.pin}
                  onChange={(value) => setFormData({ ...formData, pin: value })}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-12 rounded-xl border-2 bg-slate-50 text-xl font-black"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="h-12 flex-1 rounded-xl border-b-4 border-emerald-800 bg-emerald-600 text-white hover:bg-emerald-700 active:translate-y-1 active:border-b-0"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (dict["parent.createAccount"] || "Create Account")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => setIsAdding(false)}
                className="h-12 rounded-xl"
              >
                {dict["common.cancel"] || "Cancel"}
              </Button>
            </div>
          </form>
          <div className="mt-6 flex max-w-md items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
            <ShieldAlert className="h-6 w-6 shrink-0" />
            <p className="text-sm font-medium">
              {dict["parent.savePinNoteBefore"] || "Save the username and PIN! Your child will use them to log in on their device via the"}{" "}
              <strong>{dict["parent.kidsLogin"] || "Kids Login"}</strong> {dict["parent.savePinNoteAfter"] || "portal."}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {children.length === 0 && !isAdding ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="mb-1 text-lg font-bold text-slate-700">{dict["parent.noChildrenYet"] || "No children yet"}</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm font-medium text-slate-400">
            {dict["parent.noChildrenYetDesc"] || "Add a profile for each of your kids. They'll log in with a username and a 4-digit PIN."}
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            className="rounded-xl border-b-4 border-emerald-800 bg-emerald-600 font-bold text-white hover:bg-emerald-700 active:translate-y-1 active:border-b-0"
          >
            <UserPlus className="mr-2 h-5 w-5" /> {dict["parent.addFirstChild"] || "Add your first child"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {children.map((child) => (
            <div
              key={child.userId}
              className="group relative flex flex-col rounded-3xl border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200"
            >
              {/* Remove */}
              <button
                disabled={isPending}
                onClick={() => handleRemoveChild(child.userId)}
                title={dict["parent.removeChild"] || "Remove child"}
                className="absolute right-3 top-3 rounded-lg p-2 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Identity */}
              <div className="flex items-center gap-3 pr-8">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-4 border-emerald-50 bg-slate-50">
                  <Image
                    src={child.userImageSrc}
                    alt={child.userName}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-slate-800">
                    {child.userName}
                  </h3>
                  {child.username ? (
                    <button
                      onClick={() => copyUsername(child.username!)}
                      title={dict["parent.copyUsername"] || "Copy username"}
                      className="mt-0.5 flex max-w-full items-center gap-1 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                    >
                      <AtSign className="h-3 w-3 shrink-0" />
                      <span className="truncate">{child.username}</span>
                      <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ) : (
                    <span className="mt-0.5 block text-xs font-medium text-slate-400">
                      {dict["parent.noUsername"] || "No username"}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat icon={<Star className="h-4 w-4 fill-current text-indigo-500" />} value={child.points} label={dict["parent.stardust"] || "Stardust"} />
                <Stat icon={<Flame className="h-4 w-4 fill-current text-orange-500" />} value={child.streak} label={dict["parent.streak"] || "Streak"} />
                <Stat icon={<Heart className="h-4 w-4 fill-current text-rose-500" />} value={child.hearts} label={dict["parent.hearts"] || "Hearts"} />
                <Stat icon={<Clock className="h-4 w-4 text-emerald-500" />} value={formatDuration(child.totalSeconds)} label={dict["parent.time"] || "Time"} />
              </div>

              {/* Active course */}
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">
                  {child.activeCourse?.title ?? dict["parent.noActiveCourse"] ?? "No active course"}
                </span>
              </div>

              {/* Footer */}
              <Button
                asChild
                variant="secondary"
                className="mt-4 w-full rounded-xl font-bold"
              >
                <Link href={`/${lang}/family/children/${child.userId}`}>
                  {dict["parent.viewProgress"] || "View Progress"} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Stat = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-0.5 rounded-xl bg-slate-50 py-2 text-center">
    {icon}
    <span className="text-sm font-black leading-none text-slate-800">{value}</span>
    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
      {label}
    </span>
  </div>
);

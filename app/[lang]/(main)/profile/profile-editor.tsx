"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import {
  Check,
  LogOut,
  Loader2,
  Star,
  Flame,
  Heart,
  Mail,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateProfile } from "@/actions/profile";
import { getBuddy } from "@/lib/buddy";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

type EarnedBadge = { id: number; name: string; icon: string };

type Props = {
  initialName: string;
  initialImage: string;
  initialBuddyName: string;
  email: string;
  points: number;
  streak: number;
  hearts: number;
  buddyXp: number;
  badges: EarnedBadge[];
};

const AVATAR_SEEDS = [
  "Cosmo",
  "Nova",
  "Astro",
  "Luna",
  "Pixel",
  "Comet",
  "Orbit",
  "Stella",
];
const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

export const ProfileEditor = ({
  initialName,
  initialImage,
  initialBuddyName,
  email,
  points,
  streak,
  hearts,
  buddyXp,
  badges,
}: Props) => {
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();
  const { signOut } = useClerk();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);

  const presets = AVATAR_SEEDS.map(avatarUrl);

  const [name, setName] = useState(initialName);
  const [buddyName, setBuddyName] = useState(initialBuddyName);
  const [image, setImage] = useState(initialImage);
  // Uploaded / non-preset images shown alongside the preset avatars.
  const [customImages, setCustomImages] = useState<string[]>(
    presets.includes(initialImage) ? [] : [initialImage]
  );

  const options = [...customImages, ...presets];

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    setUploading(true);
    try {
      const res = await user.setProfileImage({ file });
      const url = res.publicUrl || user.imageUrl;
      if (url) {
        setCustomImages((prev) => [url, ...prev.filter((u) => u !== url)]);
        setImage(url);
      }
      toast.success(dict["profile.photoUploaded"] || "Photo uploaded!");
    } catch {
      toast.error(
        dict["profile.photoUploadError"] || "Couldn't upload that photo."
      );
    } finally {
      setUploading(false);
    }
  };

  const buddy = getBuddy(buddyXp);

  const onSave = () => {
    startTransition(() => {
      updateProfile(
        { userName: name, userImageSrc: image, buddyName },
        locale
      )
        .then(() => {
          toast.success(dict["profile.profileSaved"] || "Profile saved!");
          router.refresh();
        })
        .catch(() =>
          toast.error(
            dict["common.somethingWentWrong"] || "Something went wrong."
          )
        );
    });
  };

  const onSignOut = () => {
    setSigningOut(true);
    void signOut({ redirectUrl: `/${locale}` });
  };

  const stats = [
    {
      icon: Star,
      color: "text-indigo-600",
      label: dict["profile.stardust"] || "Stardust",
      value: points,
    },
    {
      icon: Flame,
      color: "text-orange-500",
      label: dict["profile.streak"] || "Streak",
      value: streak,
    },
    {
      icon: Heart,
      color: "text-rose-500",
      label: dict["profile.hearts"] || "Hearts",
      value: hearts,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[32px] border-[4px] border-indigo-700/50 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <Star className="absolute right-10 top-6 h-4 w-4 fill-current text-white/40" />
        <Star className="absolute bottom-8 right-28 h-3 w-3 fill-current text-white/30" />
        <div className="relative flex items-center gap-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/80 bg-white shadow-lg"
          >
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-indigo-100">
              <Mail className="h-4 w-4" /> {email || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-[24px] border-2 border-slate-100 bg-white p-4 shadow-sm"
          >
            <s.icon className={cn("h-6 w-6 fill-current", s.color)} />
            <div className="text-xl font-black text-slate-800">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Edit card */}
      <div className="space-y-6 rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-black tracking-tight text-slate-800">
          {dict["profile.customizeExplorer"] || "Customize your explorer"}
        </h2>

        {/* Avatar picker */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-700">
              {dict["profile.chooseAvatar"] || "Choose your avatar"}
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {dict["profile.uploadPhoto"] || "Upload photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
              onChange={onUpload}
            />
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {options.map((url) => {
              const selected = image === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImage(url)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-2xl border-2 bg-slate-50 transition-all",
                    selected
                      ? "border-indigo-500 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-indigo-300"
                  )}
                >
                  <Image
                    src={url}
                    alt={dict["profile.avatarOption"] || "Avatar option"}
                    fill
                    className="object-cover p-1"
                    sizes="64px"
                  />
                  {selected && (
                    <span className="absolute right-1 top-1 rounded-full bg-indigo-600 p-0.5 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-bold text-slate-700">
            {dict["profile.displayName"] || "Display name"}
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder={dict["profile.explorer"] || "Explorer"}
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {/* Buddy name */}
        <div className="space-y-1.5">
          <label
            htmlFor="buddyName"
            className="block text-sm font-bold text-slate-700"
          >
            {dict["profile.buddyName"] || "Buddy name"}{" "}
            <span className="font-medium text-slate-400">
              ({buddy.stage.emoji} {buddy.stage.name})
            </span>
          </label>
          <input
            id="buddyName"
            value={buddyName}
            onChange={(e) => setBuddyName(e.target.value)}
            maxLength={20}
            placeholder="Cosmo"
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <button
          onClick={onSave}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 py-3.5 font-black text-white shadow transition-all hover:bg-indigo-700 active:translate-y-1 active:border-b-0 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            dict["profile.saveChanges"] || "Save changes"
          )}
        </button>
      </div>

      {/* Badges */}
      <div className="rounded-[32px] border-2 border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-lg font-black tracking-tight text-slate-800">
          {dict["profile.starCards"] || "Star cards"} ({badges.length})
        </h2>
        {badges.length === 0 ? (
          <p className="text-sm font-medium text-slate-400">
            {dict["profile.starCardsEmpty"] ||
              "Finish lessons to collect star cards!"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-3 py-2"
                title={b.name}
              >
                <span className="text-2xl">{b.icon}</span>
                <span className="text-sm font-bold text-indigo-900">
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-rose-600 disabled:opacity-60"
      >
        {signingOut ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <LogOut className="h-5 w-5" /> {dict["common.signOut"] || "Sign out"}
          </>
        )}
      </button>
    </div>
  );
};

"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LogOut,
  Loader2,
  Mail,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import { uploadImage } from "@/actions/lesson-block";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";
import { cn } from "@/lib/utils";

type Props = {
  initialName: string;
  initialImage: string;
  email: string;
  initialFamilyName: string;
  initialFamilyCover: string;
  initialFamilyMotto: string;
};

type PresetCover = {
  name: string;
  classes?: string;
  imageSrc?: string;
};

const PRESET_COVERS: Record<string, PresetCover> = {
  space: {
    name: "Space Adventure",
    imageSrc: "/uploads/family_cover_default.png",
  },
  emerald: {
    name: "Emerald Aurora",
    classes: "from-emerald-500 to-teal-600",
  },
  sunset: {
    name: "Sunset Glow",
    classes: "from-orange-500 to-rose-600",
  },
  cosmic: {
    name: "Cosmic Stardust",
    classes: "from-indigo-600 to-violet-800",
  },
  ocean: {
    name: "Ocean Breeze",
    classes: "from-blue-500 to-cyan-600",
  },
};

export const ParentProfileEditor = ({
  initialName,
  initialImage,
  email,
  initialFamilyName,
  initialFamilyCover,
  initialFamilyMotto,
}: Props) => {
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  
  const [familyName, setFamilyName] = useState(initialFamilyName);
  const [familyCover, setFamilyCover] = useState(initialFamilyCover);
  const [familyMotto, setFamilyMotto] = useState(initialFamilyMotto);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    setUploading(true);
    try {
      const res = await user.setProfileImage({ file });
      const url = res.publicUrl || user.imageUrl;
      if (url) {
        setImage(url);
      }
      toast.success(dict["profile.photoUploaded"] || "Photo uploaded!");
    } catch {
      toast.error(dict["profile.photoUploadError"] || "Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  };

  const onUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingCover(true);
    const toastId = toast.loading(dict["profile.uploadingCover"] || "Uploading cover image...");
    try {
      const url = await uploadImage(formData);
      setFamilyCover(url);
      toast.success(dict["profile.coverUploaded"] || "Cover image uploaded successfully!", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (dict["myCourses.uploadFailed"] || "Upload failed."), { id: toastId });
    } finally {
      setUploadingCover(false);
    }
  };

  const onSave = () => {
    startTransition(() => {
      updateProfile(
        {
          userName: name,
          userImageSrc: image,
          buddyName: "",
          familyName,
          familyCover,
          familyMotto,
        },
        locale
      )
        .then(() => {
          toast.success(dict["profile.profileSaved"] || "Profile saved!");
          router.refresh();
        })
        .catch(() => toast.error(dict["common.somethingWentWrong"] || "Something went wrong."));
    });
  };

  const onSignOut = () => {
    setSigningOut(true);
    void signOut({ redirectUrl: `/${locale}` });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          {dict["profile.settingsProfile"] || "Settings & Profile"}
        </h1>
      </div>

      {/* Hero Banner Preview */}
      <div className="relative overflow-hidden rounded-[32px] border-4 border-slate-100 bg-white shadow-md">
        <div className={cn(
          "h-40 w-full relative transition-all duration-300 flex items-center justify-center bg-slate-100",
          PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.classes
            ? `bg-gradient-to-br ${PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS].classes}`
            : ""
        )}>
          {(PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.imageSrc || (!PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS] && familyCover)) && (
            <Image
              src={PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.imageSrc || familyCover}
              alt={dict["profile.familyCoverAlt"] || "Family Cover"}
              fill
              className="object-cover"
            />
          )}
          {/* Overlay to ensure contrast on image banners */}
          {(PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS]?.imageSrc || (!PRESET_COVERS[familyCover as keyof typeof PRESET_COVERS] && familyCover)) && (
            <div className="absolute inset-0 bg-black/25" />
          )}
          <div className="absolute top-4 right-4 bg-black/35 backdrop-blur-md rounded-full px-4 py-1 text-[10px] font-black text-white uppercase tracking-wider relative z-10">
            {familyName || dict["profile.myFamily"] || "My Family"}
          </div>
        </div>

        <div className="px-6 pb-6 pt-10 relative">
          <div className="absolute -top-10 left-6">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-50 shadow-md">
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-slate-800">{familyName || dict["profile.myFamily"] || "My Family"}</h2>
            {familyMotto ? (
              <p className="text-xs font-semibold text-slate-500 italic">
                "{familyMotto}"
              </p>
            ) : (
              <p className="text-xs font-bold text-slate-400">{dict["profile.noMotto"] || "No family motto set yet."}</p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span>{name}</span>
              <span className="text-slate-200">•</span>
              <Mail className="h-3.5 w-3.5" /> <span>{email || "—"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form Card */}
      <div className="space-y-6 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-black tracking-tight text-slate-800">
          {dict["profile.editProfile"] || "Edit Profile"}
        </h2>

        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-50">
            <Image
              src={image}
              alt={dict["profile.avatarAlt"] || "Avatar"}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
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
            placeholder={dict["profile.displayNamePlaceholder"] || "Parent"}
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="border-t-2 border-slate-100 my-4" />

        <h3 className="text-base font-black tracking-tight text-slate-800">
          {dict["profile.familyBranding"] || "Family Branding Settings"}
        </h3>

        {/* Family Name */}
        <div className="space-y-1.5">
          <label htmlFor="familyName" className="block text-sm font-bold text-slate-700">
            {dict["profile.familyName"] || "Family Name"}
          </label>
          <input
            id="familyName"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            maxLength={32}
            placeholder={dict["profile.familyNamePlaceholder"] || "e.g. The Henty Family"}
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Family Motto */}
        <div className="space-y-1.5">
          <label htmlFor="familyMotto" className="block text-sm font-bold text-slate-700">
            {dict["profile.familyMotto"] || "Family Motto"}
          </label>
          <input
            id="familyMotto"
            value={familyMotto}
            onChange={(e) => setFamilyMotto(e.target.value)}
            maxLength={80}
            placeholder={dict["profile.familyMottoPlaceholder"] || "e.g. Keep exploring and learning together! 🚀"}
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Cover selector */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">
            {dict["profile.coverWallpaper"] || "Cover Banner Wallpaper"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(PRESET_COVERS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFamilyCover(key)}
                className={cn(
                  "h-16 rounded-xl relative overflow-hidden bg-slate-50 flex items-center justify-center text-[10px] font-black shadow-sm transition-all border-4 text-center p-1 leading-tight",
                  preset.classes ? `bg-gradient-to-br ${preset.classes} text-white` : "text-slate-700 bg-white border-slate-100",
                  familyCover === key ? "border-emerald-500 scale-105" : "border-transparent opacity-85 hover:opacity-100"
                )}
              >
                {preset.imageSrc && (
                  <Image
                    src={preset.imageSrc}
                    alt={(dict as Record<string, string>)[`profile.cover.${key}`] || preset.name}
                    fill
                    className="object-cover opacity-40"
                    sizes="120px"
                  />
                )}
                <span className="relative z-10">{(dict as Record<string, string>)[`profile.cover.${key}`] || preset.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex items-center gap-1.5 rounded-xl border-2 border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {uploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {dict["profile.uploadCustomCover"] || "Upload custom cover image"}
            </button>
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
              onChange={onUploadCover}
            />
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-800 bg-emerald-600 py-3.5 font-black text-white shadow transition-all hover:bg-emerald-700 active:translate-y-1 active:border-b-0 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            dict["myCourses.saveChanges"] || "Save changes"
          )}
        </button>
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
            <LogOut className="h-5 w-5" /> {dict["profile.signOut"] || "Sign out"}
          </>
        )}
      </button>
    </div>
  );
};

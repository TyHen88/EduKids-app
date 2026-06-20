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
import { useLocale } from "@/app/[lang]/lang-provider";

type Props = {
  initialName: string;
  initialImage: string;
  email: string;
};

export const ParentProfileEditor = ({
  initialName,
  initialImage,
  email,
}: Props) => {
  const router = useRouter();
  const locale = useLocale();
  const { signOut } = useClerk();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);

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
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  };

  const onSave = () => {
    startTransition(() => {
      // Pass an empty string for buddyName as parents don't use buddies
      updateProfile(
        { userName: name, userImageSrc: image, buddyName: "" },
        locale
      )
        .then(() => {
          toast.success("Profile saved!");
          router.refresh();
        })
        .catch(() => toast.error("Something went wrong."));
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
          Settings & Profile
        </h1>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-[32px] border-4 border-emerald-100 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-md">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/80 bg-white shadow-lg">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              {name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-100">
              <Mail className="h-4 w-4" /> {email || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit card */}
      <div className="space-y-6 rounded-[32px] border-2 border-b-4 border-slate-100 border-b-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-black tracking-tight text-slate-800">
          Edit Profile
        </h2>

        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-50">
            <Image
              src={image}
              alt="Avatar option"
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
              Upload photo
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
            Display name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Parent"
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <button
          onClick={onSave}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-800 bg-emerald-600 py-3.5 font-black text-white shadow transition-all hover:bg-emerald-700 active:translate-y-1 active:border-b-0 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Save changes"
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
            <LogOut className="h-5 w-5" /> Sign out
          </>
        )}
      </button>
    </div>
  );
};

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useSignOut } from "@/lib/use-sign-out";
import { useDictionary } from "@/app/[lang]/lang-provider";

/**
 * Avatar button with a sign-out dropdown. Replaces Clerk's <UserButton />.
 * Reads the current user from the Supabase browser client and reacts to
 * auth-state changes.
 */
export const UserMenu = () => {
  const signOut = useSignOut();
  const dict = useDictionary();
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const sync = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setEmail(user?.email ?? null);
      const meta = (user?.user_metadata ?? {}) as Record<string, string>;
      setAvatar(meta.avatar_url || meta.picture || null);
    };

    void sync();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => void sync());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={dict["common.account"] || "Account"}
          className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 text-slate-500 transition-colors hover:border-indigo-300"
        >
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" sizes="36px" />
          ) : (
            <UserIcon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-medium text-slate-500">
          {email || dict["common.account"] || "Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="cursor-pointer font-bold text-rose-600 focus:text-rose-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {dict["common.signOut"] || "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

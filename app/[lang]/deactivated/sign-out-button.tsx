"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale, useDictionary } from "@/app/[lang]/lang-provider";

export const DeactivatedSignOut = () => {
  const { signOut } = useClerk();
  const locale = useLocale();
  const dict = useDictionary();

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={() => void signOut({ redirectUrl: `/${locale}` })}
    >
      <LogOut className="mr-2 h-5 w-5" />
      {dict["common.signOut"] || "Sign out"}
    </Button>
  );
};

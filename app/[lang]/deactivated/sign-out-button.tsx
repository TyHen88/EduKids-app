"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/lib/use-sign-out";
import { useDictionary } from "@/app/[lang]/lang-provider";

export const DeactivatedSignOut = () => {
  const signOut = useSignOut();
  const dict = useDictionary();

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={() => void signOut()}
    >
      <LogOut className="mr-2 h-5 w-5" />
      {dict["common.signOut"] || "Sign out"}
    </Button>
  );
};

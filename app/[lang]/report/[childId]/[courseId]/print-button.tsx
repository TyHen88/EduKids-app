"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

import { useDictionary } from "@/app/[lang]/lang-provider";

export const PrintButton = () => {
  const dict = useDictionary();
  // Open the print dialog automatically when the report opens (gives the
  // browser's "Save as PDF" option). Small delay so images/fonts settle.
  useEffect(() => {
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 print:hidden"
    >
      <Printer className="h-4 w-4" /> {dict["report.saveAsPdf"] || "Save as PDF"}
    </button>
  );
};

"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, FileDown } from "lucide-react";

import { useDictionary } from "@/app/[lang]/lang-provider";

/**
 * Generates the report as a PDF in the browser (html2canvas + jsPDF via
 * html2pdf.js) and downloads it directly — no print dialog. Auto-fires shortly
 * after the page opens, and can be re-triggered with the button.
 */
export const DownloadPdfButton = ({ fileName }: { fileName: string }) => {
  const dict = useDictionary();
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    const el = document.getElementById("report-paper");
    if (!el) return;

    setLoading(true);
    try {
      // Dynamic import so the (browser-only) library never runs during SSR.
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: fileName,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(el)
        .save();
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  }, [fileName]);

  // Auto-download once on open (delay lets images/fonts settle first).
  useEffect(() => {
    const t = setTimeout(() => {
      void download();
    }, 900);
    return () => clearTimeout(t);
  }, [download]);

  return (
    <button
      onClick={() => void download()}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 print:hidden"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {dict["report.downloadPdf"] || "Download PDF"}
    </button>
  );
};

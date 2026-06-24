"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          // Indigo-themed, kid-friendly toast: rounded, soft indigo border,
          // and an indigo glow shadow.
          toast:
            "group toast flex items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white p-4 text-slate-800 shadow-[0_12px_40px_-10px_rgba(79,70,229,0.35)]",
          title: "text-sm font-extrabold text-indigo-700",
          description: "text-sm font-medium text-slate-500",
          icon: "text-indigo-500",
          closeButton:
            "border-indigo-200 bg-white text-indigo-500 hover:bg-indigo-50",
          actionButton:
            "rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700",
          cancelButton: "rounded-xl bg-slate-100 font-bold text-slate-600",
          // Keep success on-brand indigo; give errors a rose accent so kids
          // still notice something went wrong.
          success: "[&_[data-icon]]:text-indigo-500",
          error: "border-rose-200 [&_[data-icon]]:text-rose-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

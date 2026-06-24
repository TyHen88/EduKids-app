"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

/**
 * Lightweight, accessible on/off switch (no extra dependency). Mirrors the
 * shadcn/ui Switch API (`checked` + `onCheckedChange`) so it can be swapped for
 * the Radix version later without touching callers.
 */
export const Switch = ({
  checked,
  onCheckedChange,
  disabled,
  id,
  ...props
}: SwitchProps) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-indigo-600" : "bg-slate-200"
    )}
    {...props}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-5" : "translate-x-0.5"
      )}
    />
  </button>
);

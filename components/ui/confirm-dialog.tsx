"use client";

import * as React from "react";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "danger" | "primary";
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) => {
  const isDanger = variant === "danger";

  // Radix occasionally leaves `pointer-events: none` on <body> after a modal
  // closes via an outside click, which silently kills :hover elsewhere on the
  // page (e.g. hover-revealed table actions). Clear it once the dialog closes.
  React.useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                isDanger
                  ? "bg-rose-50 text-rose-600"
                  : "bg-indigo-50 text-indigo-600"
              )}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="pt-1 text-sm text-slate-500">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-2 gap-2 sm:gap-0">
          <Button
            variant="primaryOutline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

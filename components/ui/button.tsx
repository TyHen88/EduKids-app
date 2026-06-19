import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-white text-slate-700 border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-50",

        // custom
        locked:
          "bg-slate-200 text-slate-500 hover:bg-slate-200/90 border-slate-300 border-b-4 active:border-b-0",

        primary:
          "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-800 border-b-4 active:border-b-0",
        primaryOutline:
          "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200 border-2",

        secondary:
          "bg-indigo-500 text-white hover:bg-indigo-600 border-indigo-700 border-b-4 active:border-b-0",
        secondaryOutline: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",

        danger:
          "bg-rose-500 text-white hover:bg-rose-600 border-rose-600 border-b-4 active:border-b-0",
        dangerOutline: "bg-rose-50 text-rose-500 hover:bg-rose-100",

        super:
          "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-800 border-b-4 active:border-b-0",
        superOutline: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",

        ghost:
          "bg-transparent text-slate-600 border-transparent border-0 hover:bg-slate-100",

        sidebar:
          "bg-transparent text-slate-600 border-2 border-transparent hover:bg-slate-100 transition-none",
        sidebarOutline:
          "bg-indigo-500/15 text-indigo-700 border-indigo-300 border-2 hover:bg-indigo-500/25 transition-none",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",

        // custom
        rounded: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

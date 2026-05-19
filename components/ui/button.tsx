import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.18em] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-y text-black hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(240,201,58,0.25)] after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/15 after:to-transparent after:pointer-events-none",
        outline:
          "border border-y/30 text-y bg-transparent hover:bg-y/[0.06] hover:border-y hover:-translate-y-px",
        ghost:
          "bg-white/[0.04] border border-border-faint text-text/80 hover:bg-white/[0.06] hover:text-y hover:border-y/30",
        link: "text-y hover:text-white px-0 py-0 [text-shadow:0_0_18px_rgba(240,201,58,0.4)]",
        destructive:
          "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20",
      },
      size: {
        sm: "h-9 px-4 text-[10px] rounded-[3px]",
        md: "h-12 px-8 text-[11px] rounded-[3px]",
        lg: "h-14 px-10 text-[13px] rounded-[3px]",
        icon: "h-9 w-9 rounded-[4px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };

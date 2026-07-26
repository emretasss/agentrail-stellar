import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
  {
    variants: {
      variant: {
        default: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        secondary: "border-white/10 bg-white/[.05] text-slate-300",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        destructive: "border-red-400/20 bg-red-400/10 text-red-300",
        outline: "border-white/10 text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

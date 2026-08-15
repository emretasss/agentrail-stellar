import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#78e8ff]/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#8c84ff]/45 bg-gradient-to-br from-[#8279ff] via-[#6860ec] to-[#4e47cf] text-white shadow-[0_10px_28px_rgba(91,80,220,.24),inset_0_1px_rgba(255,255,255,.22)] hover:brightness-110 hover:shadow-[0_14px_36px_rgba(91,80,220,.34),0_0_0_4px_rgba(116,108,255,.07)]",
        destructive: "bg-red-500 text-white hover:bg-red-400",
        outline:
          "border border-white/10 bg-white/[.035] text-slate-100 hover:border-white/20 hover:bg-white/[.07]",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
        ghost: "text-slate-300 hover:bg-white/[.06] hover:text-white",
        link: "text-[#78e8ff] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

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
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };

import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "protocol-card min-w-0 rounded-2xl border border-white/[.075] bg-[#0a0b19]/78 text-slate-100 shadow-[0_22px_80px_rgba(0,0,0,.24)] backdrop-blur-xl transition-all duration-300",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />;
}

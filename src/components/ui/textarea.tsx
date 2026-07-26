import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

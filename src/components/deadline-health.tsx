import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeadlineHealth({ deadline, current }: { deadline?: number; current: number | null }) {
  if (!deadline || !current) return <span className="text-[10px] text-slate-700">Not available</span>;
  const remaining = deadline - current;
  const expired = remaining < 0;
  const urgent = remaining >= 0 && remaining < 250;
  const label = expired ? `${Math.abs(remaining).toLocaleString()} ledgers overdue` : `${remaining.toLocaleString()} ledgers left`;
  return <span className={cn("inline-flex items-center gap-1.5 text-[10px]", expired ? "text-red-300" : urgent ? "text-amber-300" : "text-slate-500")} title={`Deadline ledger ${deadline.toLocaleString()}`}><Clock3 size={11} />{label}</span>;
}

import { CheckCircle2, CircleDollarSign, Clock3, ShieldAlert } from "lucide-react";
import { decimalFromStroops } from "@/lib/stellar";
import type { Job } from "@/types/agentrail";

export function JobHealthSummary({ jobs }: { jobs: Job[] }) {
  const protectedValue = jobs.filter((job) => job.status === "Funded" || job.status === "Delivered").reduce((sum, job) => sum + job.amountStroops, 0n);
  const metrics = [
    { label: "Needs review", value: jobs.filter((job) => job.status === "Delivered").length, icon: Clock3, tone: "text-[#ffbf69]" },
    { label: "Protected value", value: `${decimalFromStroops(protectedValue)} XLM`, icon: CircleDollarSign, tone: "text-[#bcb8ff]" },
    { label: "Disputes", value: jobs.filter((job) => job.status === "Disputed").length, icon: ShieldAlert, tone: "text-[#ff8f9c]" },
    { label: "Settled", value: jobs.filter((job) => job.status === "Released").length, icon: CheckCircle2, tone: "text-[#69e8b6]" },
  ];
  return <div className="mb-3 grid gap-2 grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[.075] bg-[#0b0d1c]/85 p-3"><span className={`grid size-8 place-items-center rounded-lg bg-white/[.04] ${tone}`}><Icon size={14} /></span><div><span className="block text-[9px] font-medium uppercase tracking-[.1em] text-[#7f8aa0]">{label}</span><strong className="mt-1 block text-sm text-[#eef3ff]">{value}</strong></div></div>)}</div>;
}

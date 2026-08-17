import { Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import type { Job } from "@/types/agentrail";

export function SettlementHealth({ jobs }: { jobs: Job[] }) {
  const total = Math.max(jobs.length, 1);
  const settled = Math.round((jobs.filter((job) => job.status === "Released").length / total) * 100);
  const disputed = Math.round((jobs.filter((job) => job.status === "Disputed").length / total) * 100);
  const active = Math.round((jobs.filter((job) => job.status === "Funded" || job.status === "Delivered").length / total) * 100);
  const metrics = [{ label: "Settlement rate", value: settled, icon: CheckCircle2, color: "#69e8b6" }, { label: "Active utilization", value: active, icon: Activity, color: "#8fdcff" }, { label: "Dispute exposure", value: disputed, icon: ShieldAlert, color: "#ff8f9c" }];
  return <section className="grid gap-3 rounded-2xl border border-white/[.08] bg-[#0b0d1c]/85 p-5 md:grid-cols-3">{metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-xl border border-white/[.065] bg-white/[.025] p-4"><div className="flex items-center justify-between"><Icon size={15} style={{ color }} /><strong className="text-lg text-white">{value}%</strong></div><span className="mt-4 block text-[10px] font-medium text-[#9ba6bd]">{label}</span><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}55` }} /></div></div>)}</section>;
}

import { CheckCircle2, CircleDollarSign, FileCheck2, LockKeyhole } from "lucide-react";
import type { Job } from "@/types/agentrail";

export function MissionFunnel({ jobs }: { jobs: Job[] }) {
  const stages = [
    { label: "Funded", icon: LockKeyhole, count: jobs.filter((job) => job.status === "Funded").length, color: "#8f88ff" },
    { label: "Delivered", icon: FileCheck2, count: jobs.filter((job) => job.status === "Delivered").length, color: "#78e8ff" },
    { label: "Released", icon: CircleDollarSign, count: jobs.filter((job) => job.status === "Released").length, color: "#61f6c2" },
  ];
  const completed = stages[2].count;
  const actionable = stages[0].count + stages[1].count;
  const completionRate = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;

  return (
    <section className="mt-3 rounded-2xl border border-white/[.07] bg-[#0a0b19]/75 p-5" aria-labelledby="mission-funnel-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 id="mission-funnel-title" className="text-sm font-semibold text-slate-200">Mission settlement funnel</h3>
          <p className="mt-1 text-xs text-slate-600">Where value is currently moving through the protocol</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/[.06] bg-white/[.025] px-3 py-1.5 text-[10px] text-slate-500">
          <CheckCircle2 size={12} className="text-[#61f6c2]" />
          {completionRate}% settled · {actionable} need action
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {stages.map(({ label, icon: Icon, count, color }, index) => {
          const width = Math.max(12, jobs.length ? (count / jobs.length) * 100 : 12);
          return (
            <div key={label} className="relative overflow-hidden rounded-xl border border-white/[.055] bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-8 place-items-center rounded-lg" style={{ color, backgroundColor: `${color}12` }}><Icon size={14} /></span>
                <span className="font-mono text-xl font-semibold text-slate-200">{count}</span>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px]">
                <span className="font-semibold uppercase tracking-[.12em] text-slate-600">{label}</span>
                <span className="text-slate-700">0{index + 1}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.04]">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${width}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}66` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

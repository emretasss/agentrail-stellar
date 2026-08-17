import { CheckCircle2, FileKey2, ShieldCheck, TriangleAlert } from "lucide-react";
import type { MissionPlan } from "@/components/mission-copilot";

export function MissionQuality({ plan }: { plan: MissionPlan }) {
  const dimensions = [
    { label: "Deliverable coverage", value: Math.min(100, plan.deliverables.length * 25), icon: CheckCircle2 },
    { label: "Acceptance precision", value: Math.min(100, plan.acceptanceCriteria.length * 25), icon: ShieldCheck },
    { label: "Risk visibility", value: Math.min(100, plan.risks.length * 34), icon: TriangleAlert },
    { label: "Evidence readiness", value: /evidence|source|reference|proof/i.test([...plan.deliverables, ...plan.acceptanceCriteria].join(" ")) ? 100 : 50, icon: FileKey2 },
  ];
  const overall = Math.round(dimensions.reduce((sum, item) => sum + item.value, 0) / dimensions.length);
  return <div className="rounded-xl border border-white/[.06] bg-black/20 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.13em] text-slate-600">Escrow readiness</span><strong className="text-sm text-[#61f6c2]">{overall}%</strong></div><div className="mt-3 grid grid-cols-2 gap-2">{dimensions.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-lg bg-white/[.025] p-2.5"><div className="flex items-center gap-1.5"><Icon size={11} className={value >= 75 ? "text-[#61f6c2]" : "text-amber-300"} /><span className="text-[8px] text-slate-600">{label}</span></div><div className="mt-2 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-gradient-to-r from-[#746cff] to-[#61f6c2]" style={{ width: `${value}%` }} /></div><span className="font-mono text-[8px] text-slate-700">{value}</span></div></div>)}</div></div>;
}

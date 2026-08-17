import { ArrowRight, CheckCircle2, Clock3, FileCheck2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decimalFromStroops } from "@/lib/stellar";
import type { Agent, Job } from "@/types/agentrail";

const priority = { Delivered: 0, Disputed: 1, Funded: 2, Released: 3, Refunded: 4 } as const;

export function ActionQueue({ jobs, agents, onOpenJobs }: { jobs: Job[]; agents: Agent[]; onOpenJobs: () => void }) {
  const items = [...jobs].sort((a, b) => priority[a.status] - priority[b.status]).slice(0, 4);

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-white/[.09] bg-[#0b0d1c]/90 shadow-[0_24px_70px_rgba(0,0,0,.2)]">
      <header className="flex items-center justify-between border-b border-white/[.07] px-5 py-4">
        <div>
          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#ffbf69] shadow-[0_0_12px_rgba(255,191,105,.55)]" /><h3 className="text-sm font-semibold text-white">Action queue</h3></div>
          <p className="mt-1 text-xs text-[#9ba6bd]">Missions that need attention or monitoring</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onOpenJobs}>View all <ArrowRight size={12} /></Button>
      </header>
      <div className="divide-y divide-white/[.06]">
        {items.map((job) => {
          const agent = agents.find((entry) => entry.id === job.agentId);
          const state = {
            Delivered: { icon: FileCheck2, label: "Review delivery", copy: "Evidence submitted—buyer approval is next", tone: "text-[#ffbf69]", badge: "Needs review" },
            Disputed: { icon: ShieldAlert, label: "Dispute open", copy: "Escrow is frozen pending resolution", tone: "text-[#ff8f9c]", badge: "Escalated" },
            Funded: { icon: Clock3, label: "Agent working", copy: "Funds protected while delivery is pending", tone: "text-[#8fdcff]", badge: "In progress" },
            Released: { icon: CheckCircle2, label: "Settled", copy: "Payment and reputation recorded", tone: "text-[#69e8b6]", badge: "Complete" },
            Refunded: { icon: CheckCircle2, label: "Recovered", copy: "Escrow returned to the buyer", tone: "text-[#aab4c8]", badge: "Closed" },
          }[job.status];
          const Icon = state.icon;
          return (
            <button key={job.id} onClick={onOpenJobs} className="group flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[.035]">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.035] ${state.tone}`}><Icon size={16} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm font-medium text-[#eef3ff]">{state.label}</strong><span className="font-mono text-[10px] text-[#78849b]">AR-{String(job.id).padStart(4, "0")}</span></span><span className="mt-1 block truncate text-xs text-[#929db4]">@{agent?.handle ?? "unknown"} · {state.copy}</span></span>
              <span className="hidden text-right sm:block"><Badge variant="secondary">{state.badge}</Badge><strong className="mt-1.5 block text-xs text-[#cbd4e5]">{decimalFromStroops(job.amountStroops)} XLM</strong></span>
              <ArrowRight size={13} className="text-[#5e6980] transition group-hover:translate-x-1 group-hover:text-[#8fdcff]" />
            </button>
          );
        })}
        {!items.length && <div className="grid min-h-64 place-items-center px-6 text-center"><div><CheckCircle2 className="mx-auto text-[#69e8b6]" size={24} /><h4 className="mt-3 text-sm font-medium text-white">Queue is clear</h4><p className="mt-1 text-xs text-[#929db4]">Start a mission to put protected agent work on the rail.</p></div></div>}
      </div>
    </section>
  );
}

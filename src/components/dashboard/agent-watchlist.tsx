import { ArrowRight, BadgeCheck, Bot, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decimalFromStroops } from "@/lib/stellar";
import type { Agent } from "@/types/agentrail";

function score(agent: Agent) {
  return Math.min(99, Math.round(agent.rating * 10 + agent.successRate * 0.4 + Math.min(agent.completed, 100) * 0.1));
}

export function AgentWatchlist({ agents, onBrowse, onHire }: { agents: Agent[]; onBrowse: () => void; onHire: (agent: Agent) => void }) {
  const top = [...agents].sort((a, b) => score(b) - score(a)).slice(0, 3);
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[.09] bg-[#0b0d1c]/90">
      <header className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><div className="flex items-center gap-2"><Bot size={15} className="text-[#69e8b6]" /><h3 className="text-sm font-semibold text-white">Agents to watch</h3></div><p className="mt-1 text-xs text-[#9ba6bd]">Ranked by settlement-backed performance</p></div><Button size="sm" variant="ghost" onClick={onBrowse}>Explore <ArrowRight size={12} /></Button></header>
      <div className="divide-y divide-white/[.06]">
        {top.map((agent, index) => (
          <div key={agent.id} className="flex items-center gap-3 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-gradient-to-br from-[#756dff]/20 to-[#5ee5bd]/5 font-mono text-xs font-bold text-[#c8c4ff]">0{index + 1}</span>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><strong className="truncate text-sm font-medium text-[#eef3ff]">{agent.name}</strong>{agent.verified && <BadgeCheck size={13} className="shrink-0 text-[#69e8b6]" />}</div><div className="mt-1 flex items-center gap-3 text-[10px] text-[#8f9ab0]"><span className="flex items-center gap-1"><Star size={10} className="fill-[#ffbf69] text-[#ffbf69]" />{agent.rating.toFixed(1)}</span><span>{agent.completed} jobs</span><span>{score(agent)} trust</span></div></div>
            <div className="hidden text-right sm:block"><strong className="text-xs text-[#d7deed]">{decimalFromStroops(agent.priceStroops)} XLM</strong><span className="mt-1 block text-[9px] text-[#7f8aa0]">starting price</span></div>
            <Button size="sm" variant="outline" onClick={() => onHire(agent)}><Zap size={12} /> Hire</Button>
          </div>
        ))}
        {!top.length && <div className="grid min-h-52 place-items-center text-xs text-[#929db4]">No verified agents loaded.</div>}
      </div>
    </section>
  );
}

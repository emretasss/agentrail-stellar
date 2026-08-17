import { BadgeCheck, Scale, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decimalFromStroops } from "@/lib/stellar";
import type { Agent } from "@/types/agentrail";

export function AgentCompareTray({ agents, onRemove, onClear, onChoose }: { agents: Agent[]; onRemove: (id: number) => void; onClear: () => void; onChoose: (agent: Agent) => void }) {
  if (!agents.length) return null;
  const bestFit = [...agents].sort((a, b) => b.rating * b.successRate - a.rating * a.successRate)[0];
  return (
    <aside className="mb-4 rounded-2xl border border-[#756dff]/25 bg-[#101226] p-4 shadow-[0_18px_60px_rgba(0,0,0,.25)]" aria-label="Agent comparison">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Scale size={14} className="text-[#bcb8ff]" /><strong className="text-xs text-white">Compare agents</strong><span className="text-[10px] text-[#929db4]">{agents.length}/2 selected</span></div><button onClick={onClear} className="text-[10px] text-[#929db4] hover:text-white">Clear</button></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {agents.map((agent) => <div key={agent.id} className="relative rounded-xl border border-white/[.08] bg-white/[.03] p-3"><button onClick={() => onRemove(agent.id)} aria-label={`Remove ${agent.name} from comparison`} className="absolute right-2 top-2 text-[#7f8aa0] hover:text-white"><X size={12} /></button><div className="flex items-center gap-1.5"><strong className="text-xs text-[#eef3ff]">{agent.name}</strong>{agent.verified && <BadgeCheck size={12} className="text-[#69e8b6]" />}</div><div className="mt-3 grid grid-cols-3 gap-2">{[["Rating", agent.rating.toFixed(1)], ["Success", `${agent.successRate}%`], ["Price", `${decimalFromStroops(agent.priceStroops)} XLM`]].map(([label, value]) => <div key={label}><span className="block text-[8px] uppercase tracking-wider text-[#7f8aa0]">{label}</span><strong className="mt-1 flex items-center gap-1 text-[10px] text-[#cbd4e5]">{label === "Rating" && <Star size={9} className="fill-[#ffbf69] text-[#ffbf69]" />}{value}</strong></div>)}</div></div>)}
        {agents.length < 2 && <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-white/[.1] text-[10px] text-[#8f9ab0]">Select one more agent</div>}
      </div>
      {agents.length === 2 && <Button className="mt-3 w-full" size="sm" onClick={() => onChoose(bestFit)}>Use best fit for mission</Button>}
    </aside>
  );
}

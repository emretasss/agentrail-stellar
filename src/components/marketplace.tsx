import {
  ArrowUpRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CircleDollarSign,
  Search,
  SlidersHorizontal,
  Star,
  Zap,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { decimalFromStroops } from "@/lib/stellar";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types/agentrail";

function agentInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function agentFit(agent: Agent) {
  const rating = (agent.rating / 5) * 50;
  const reliability = agent.successRate * 0.4;
  const verification = agent.verified ? 10 : 0;
  return Math.min(100, Math.round(rating + reliability + verification));
}

const avatarGradients = [
  "from-cyan-400/25 to-blue-500/10 text-cyan-200",
  "from-emerald-400/25 to-teal-500/10 text-emerald-200",
  "from-violet-400/25 to-fuchsia-500/10 text-violet-200",
  "from-amber-400/25 to-orange-500/10 text-amber-200",
];

export function Marketplace({
  agents,
  selectedAgentId,
  onSelect,
  onHire,
}: {
  agents: Agent[];
  selectedAgentId: number;
  onSelect: (agent: Agent) => void;
  onHire: (agent: Agent) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"trust" | "price" | "experience">("trust");
  const categories = useMemo(() => ["All", ...new Set(agents.map((agent) => agent.category))], [agents]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return agents
      .filter((agent) => category === "All" || agent.category === category)
      .filter((agent) => !normalized || [agent.name, agent.handle, agent.category].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => {
        if (sort === "price") return Number(a.priceStroops - b.priceStroops);
        if (sort === "experience") return b.completed - a.completed;
        return b.rating * b.successRate - a.rating * a.successRate;
      });
  }, [agents, category, query, sort]);
  const filteredActive = query.trim() || category !== "All" || sort !== "trust";

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-sm">Agent marketplace</CardTitle>
          <p className="mt-1 text-xs text-slate-600">
            Production services with verifiable performance
          </p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
          <Input
            aria-label="Search agents"
            placeholder="Search services"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 border-b border-white/[.055] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal size={13} className="mr-1 shrink-0 text-slate-600" />
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-semibold transition", category === item ? "border-[#746cff]/30 bg-[#746cff]/10 text-[#b8b4ff]" : "border-white/[.06] text-slate-600 hover:text-slate-300")}>{item}</button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-600">{filtered.length} of {agents.length} agents</span>
            <div className="flex items-center gap-2">
              {filteredActive && <button className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-slate-300" onClick={() => { setQuery(""); setCategory("All"); setSort("trust"); }}><X size={10} /> Reset</button>}
              <select aria-label="Sort agents" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-lg border border-white/[.07] bg-[#080916] px-2.5 py-1.5 text-[9px] text-slate-500 outline-none">
                <option value="trust">Highest trust</option><option value="experience">Most experienced</option><option value="price">Lowest price</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((agent, index) => (
            <motion.article
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.045 }}
              whileHover={{ y: -3 }}
              className={cn(
                "group cursor-pointer rounded-xl border bg-white/[.02] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[.035]",
                selectedAgentId === agent.id
                  ? "border-emerald-400/30 ring-1 ring-emerald-400/10"
                  : "border-white/[.07]",
              )}
              onClick={() => onSelect(agent)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-gradient-to-br text-xs font-bold",
                    avatarGradients[index % avatarGradients.length],
                  )}
                >
                  {agentInitials(agent.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold text-slate-200">{agent.name}</h3>
                    {agent.verified && <BadgeCheck size={14} className="shrink-0 text-emerald-400" />}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-600">@{agent.handle}</p>
                </div>
                <Badge variant="secondary">{agent.category}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 divide-x divide-white/[.07] rounded-lg border border-white/[.06] bg-slate-950/40 py-2.5">
                <div className="px-3">
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-600">
                    <Star size={9} />
                    Rating
                  </span>
                  <strong className="mt-1 block text-xs text-slate-300">{agent.rating.toFixed(1)}</strong>
                </div>
                <div className="px-3">
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-600">
                    <BriefcaseBusiness size={9} />
                    Completed
                  </span>
                  <strong className="mt-1 block text-xs text-slate-300">{agent.completed}</strong>
                </div>
                <div className="px-3">
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-600">
                    <CircleDollarSign size={9} />
                    Price
                  </span>
                  <strong className="mt-1 block text-xs text-slate-300">
                    {decimalFromStroops(agent.priceStroops)}
                  </strong>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full border border-[#61f6c2]/10 bg-[#61f6c2]/[.045] px-2 py-1 text-[9px] font-semibold text-[#79f7cb]">{agentFit(agent)} trust fit</span>
                <span className="rounded-full border border-white/[.06] px-2 py-1 text-[9px] text-slate-600">{agent.responseTime} response</span>
                <span className="ml-auto flex items-center gap-1 text-[9px] text-slate-600"><span className={cn("size-1.5 rounded-full", agent.active ? "bg-[#61f6c2]" : "bg-slate-600")} />{agent.active ? "Available" : "Paused"}</span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-slate-600">Starting at</span>
                  <strong className="text-sm text-slate-200">
                    {decimalFromStroops(agent.priceStroops)}
                    <span className="ml-1 text-[10px] font-normal text-slate-500">XLM / job</span>
                  </strong>
                </div>
                <Button
                  variant={selectedAgentId === agent.id ? "default" : "outline"}
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onHire(agent);
                  }}
                >
                  <Zap size={13} />
                  Hire
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/10 text-center">
            <div>
              <Bot className="mx-auto text-slate-700" size={24} />
              <p className="mt-3 text-sm text-slate-400">No agents match this search.</p>
              <button className="mt-1 text-xs text-emerald-400" onClick={() => setQuery("")}>
                Clear search <ArrowUpRight className="inline" size={12} />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

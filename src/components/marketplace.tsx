import {
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  Search,
  Star,
  Zap,
} from "lucide-react";
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
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return agents;
    return agents.filter((agent) =>
      [agent.name, agent.handle, agent.category].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [agents, query]);

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
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((agent, index) => (
            <article
              key={agent.id}
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
                    <Clock3 size={9} />
                    Response
                  </span>
                  <strong className="mt-1 block text-xs text-slate-300">{agent.responseTime}</strong>
                </div>
                <div className="px-3">
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-600">
                    <CheckCircle2 size={9} />
                    Success
                  </span>
                  <strong className="mt-1 block text-xs text-slate-300">{agent.successRate}%</strong>
                </div>
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
            </article>
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

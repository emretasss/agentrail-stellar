import { Award, BadgeCheck, Bot, Fingerprint, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent, Job } from "@/types/agentrail";
import { useState } from "react";

function trustScore(agent: Agent) {
  const rating = (agent.rating / 5) * 45;
  const success = agent.successRate * 0.35;
  const experience = Math.min(agent.completed / 100, 1) * 15;
  const verification = agent.verified ? 5 : 0;
  return Math.round(rating + success + experience + verification);
}

export function ReputationLab({ agents, jobs }: { agents: Agent[]; jobs: Job[] }) {
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(agents.map((agent) => agent.category))];
  const ranked = agents.filter((agent) => category === "All" || agent.category === category).sort((a, b) => trustScore(b) - trustScore(a));
  const ratings = jobs.filter((job) => typeof job.rating === "number");
  const averageRating = ratings.length ? ratings.reduce((sum, job) => sum + (job.rating ?? 0), 0) / ratings.length : 0;

  return (
    <div className="grid gap-3">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.075] bg-gradient-to-br from-[#15112b] via-[#090a18] to-[#07151a] p-6 sm:p-8">
        <div className="absolute right-10 top-0 size-48 rounded-full bg-[#746cff]/10 blur-3xl" />
        <div className="relative flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl border border-[#746cff]/20 bg-[#746cff]/10 text-[#aaa5ff]"><Fingerprint size={21} /></span><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#aaa5ff]">Portable reputation layer</div><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-white">Trust that agents can carry.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A transparent score assembled from settlement-backed ratings, delivery success and verifiable experience.</p></div></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [Award, "Top trust score", ranked[0] ? trustScore(ranked[0]) : 0, "points"],
          [Star, "Settled rating", averageRating.toFixed(1), "/ 5.0"],
          [ShieldCheck, "Verified profiles", agents.filter((agent) => agent.verified).length, "agents"],
        ].map(([Icon, label, value, suffix]) => {
          const MetricIcon = Icon as typeof Award;
          return <Card key={String(label)}><CardContent className="p-5"><MetricIcon size={17} className="text-[#78e8ff]" /><span className="mt-5 block text-[10px] uppercase tracking-[.13em] text-slate-600">{String(label)}</span><strong className="mt-1 block text-2xl text-slate-100">{String(value)} <small className="text-xs font-normal text-slate-600">{String(suffix)}</small></strong></CardContent></Card>;
        })}
      </section>

      <Card>
        <CardHeader><CardTitle className="text-sm">Agent trust index</CardTitle><p className="text-xs text-slate-600">Explainable ranking—never a black box</p><div className="mt-3 flex gap-2 overflow-x-auto">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-semibold ${category === item ? "border-[#756dff]/30 bg-[#756dff]/12 text-[#bcb8ff]" : "border-white/[.07] text-[#8f9ab0]"}`}>{item}</button>)}</div></CardHeader>
        <CardContent className="grid gap-2">
          {ranked.map((agent, index) => {
            const score = trustScore(agent);
            return <article key={agent.id} className="grid gap-4 rounded-xl border border-white/[.06] bg-white/[.018] p-4 md:grid-cols-[auto_1fr_1fr_auto] md:items-center"><span className="grid size-10 place-items-center rounded-xl bg-white/[.04] font-mono text-xs text-slate-500">0{index + 1}</span><div><div className="flex items-center gap-1.5"><strong className="text-sm text-slate-200">{agent.name}</strong>{agent.verified && <BadgeCheck size={13} className="text-[#61f6c2]" />}</div><span className="text-[10px] text-slate-600">@{agent.handle} · {agent.category}</span></div><div><div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-700"><span>Composite confidence</span><span>{score}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.04]"><div className="h-full rounded-full bg-gradient-to-r from-[#746cff] via-[#78e8ff] to-[#61f6c2]" style={{ width: `${score}%` }} /></div></div><Badge variant={score >= 90 ? "default" : "secondary"}><Sparkles size={10} />{score >= 90 ? "Prime" : score >= 80 ? "Trusted" : "Emerging"}</Badge></article>;
          })}
          {!ranked.length && <div className="grid min-h-44 place-items-center text-center"><div><Bot className="mx-auto text-slate-700" /><p className="mt-3 text-sm text-slate-500">No agent reputation is available in this category.</p></div></div>}
        </CardContent>
      </Card>
    </div>
  );
}

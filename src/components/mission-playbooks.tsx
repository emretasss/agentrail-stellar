import { ArrowRight, Bookmark, BookOpenCheck, Layers3, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { missionPlaybooks, type MissionPlaybook } from "@/data/mission-playbooks";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function MissionPlaybooks({ onUse }: { onUse: (playbook: MissionPlaybook) => void }) {
  const categories = ["All", ...new Set(missionPlaybooks.map(({ category }) => category))];
  const [category, setCategory] = useState("All");
  const [risk, setRisk] = useState<MissionPlaybook["risk"] | "All">("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useLocalStorage<string[]>("agentrail-saved-playbooks", []);
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visible = missionPlaybooks.filter((item) => category === "All" || item.category === category).filter((item) => risk === "All" || item.risk === risk).filter((item) => !savedOnly || saved.includes(item.id)).filter((item) => !term || `${item.title} ${item.category} ${item.outcome} ${item.rails.join(" ")}`.toLowerCase().includes(term));
  const toggleSaved = (id: string) => setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.075] bg-[#090a18] p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#746cff]/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#aaa5ff]"><BookOpenCheck size={13} /> Mission playbook library</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">Start from proven trust patterns.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Reusable mission blueprints that pair clear deliverables with the right escrow and evidence rails.</p>
        </div>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8aa0]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search outcomes or trust rails" className="h-9 pl-8 text-xs" /></div>
        <select aria-label="Filter playbooks by risk" value={risk} onChange={(event) => setRisk(event.target.value as typeof risk)} className="h-9 rounded-lg border border-white/[.08] bg-[#090b18] px-3 text-[10px] text-[#a8b2c6] outline-none"><option value="All">All risk levels</option><option value="Low">Low risk</option><option value="Medium">Medium risk</option><option value="High">High risk</option></select>
        <button onClick={() => setSavedOnly((current) => !current)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-semibold ${savedOnly ? "border-[#746cff]/35 bg-[#746cff]/15 text-[#c1bdff]" : "border-white/[.08] text-[#a8b2c6]"}`}><Bookmark size={12} fill={savedOnly ? "currentColor" : "none"} /> Saved ({saved.length})</button>
        <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${category === item ? "border-[#746cff]/35 bg-[#746cff]/15 text-[#c1bdff]" : "border-white/[.07] text-slate-600 hover:text-slate-300"}`}>{item}</button>)}</div>
      </div>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((playbook) => <article key={playbook.id} className="group flex min-h-80 flex-col rounded-2xl border border-white/[.07] bg-[#0a0b19]/75 p-5 transition hover:-translate-y-1 hover:border-[#746cff]/25"><div className="flex items-center justify-between"><Badge variant="secondary">{playbook.category}</Badge><div className="flex items-center gap-2"><span className={`flex items-center gap-1 text-[9px] ${playbook.risk === "High" ? "text-amber-300" : "text-slate-600"}`}><ShieldAlert size={10} />{playbook.risk} risk</span><button onClick={() => toggleSaved(playbook.id)} aria-label={`${saved.includes(playbook.id) ? "Remove" : "Save"} ${playbook.title}`} className={`grid size-7 place-items-center rounded-lg border transition ${saved.includes(playbook.id) ? "border-[#746cff]/30 bg-[#746cff]/12 text-[#bcb8ff]" : "border-white/[.07] text-[#7f8aa0] hover:text-white"}`}><Bookmark size={12} fill={saved.includes(playbook.id) ? "currentColor" : "none"} /></button></div></div><h3 className="mt-5 text-lg font-semibold text-slate-100">{playbook.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{playbook.outcome}</p><div className="mt-5 grid gap-2">{playbook.rails.map((rail) => <span key={rail} className="flex items-center gap-2 text-[10px] text-slate-600"><Layers3 size={11} className="text-[#78e8ff]" />{rail}</span>)}</div><div className="mt-auto flex items-end justify-between pt-6"><div><span className="block text-[9px] uppercase tracking-wider text-slate-700">Typical budget</span><strong className="mt-1 block text-xs text-slate-300">{playbook.budget}</strong></div><Button size="sm" variant="outline" onClick={() => onUse(playbook)}><Sparkles size={12} /> Use <ArrowRight size={11} /></Button></div></article>)}
      </section>
      {!visible.length && <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-white/[.1] text-center"><div><Search className="mx-auto text-[#7f8aa0]" size={20} /><p className="mt-3 text-sm text-[#a8b2c6]">No playbooks match these filters.</p></div></div>}
    </div>
  );
}

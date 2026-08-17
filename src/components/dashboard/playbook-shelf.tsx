import { ArrowRight, BookOpenCheck, Braces, DatabaseZap, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { missionPlaybooks, type MissionPlaybook } from "@/data/mission-playbooks";

const icons = [ScanSearch, DatabaseZap, Braces];

export function PlaybookShelf({ onBrowse, onUse }: { onBrowse: () => void; onUse: (playbook: MissionPlaybook) => void }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[.09] bg-[#0b0d1c]/90">
      <header className="flex flex-col justify-between gap-3 border-b border-white/[.07] px-5 py-4 sm:flex-row sm:items-center">
        <div><div className="flex items-center gap-2"><BookOpenCheck size={15} className="text-[#a9a3ff]" /><h3 className="text-sm font-semibold text-white">Mission Library</h3><span className="rounded-full border border-[#756dff]/20 bg-[#756dff]/10 px-2 py-0.5 text-[9px] font-bold text-[#bcb8ff]">6 PLAYBOOKS</span></div><p className="mt-1 text-xs text-[#9ba6bd]">Launch from a proven scope, evidence model and acceptance rubric</p></div>
        <Button size="sm" variant="outline" onClick={onBrowse}>Browse library <ArrowRight size={12} /></Button>
      </header>
      <div className="grid gap-3 p-4 lg:grid-cols-3">
        {missionPlaybooks.slice(0, 3).map((playbook, index) => {
          const Icon = icons[index];
          return (
            <article key={playbook.id} className="group flex min-h-52 flex-col rounded-xl border border-white/[.08] bg-[#101326] p-4 transition hover:-translate-y-1 hover:border-[#756dff]/35 hover:bg-[#12162b]">
              <div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-xl border border-[#756dff]/20 bg-[#756dff]/10 text-[#bcb8ff]"><Icon size={16} /></span><span className="text-[10px] font-medium text-[#8995ac]">{playbook.budget}</span></div>
              <span className="mt-5 text-[9px] font-bold uppercase tracking-[.14em] text-[#7f8aa0]">{playbook.category}</span>
              <h4 className="mt-2 text-[15px] font-semibold text-[#f2f5ff]">{playbook.title}</h4>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#9ba6bd]">{playbook.outcome}</p>
              <button onClick={() => onUse(playbook)} className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-semibold text-[#8fdcff] transition group-hover:text-white">Use playbook <ArrowRight size={12} className="transition group-hover:translate-x-1" /></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

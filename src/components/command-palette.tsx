import { ArrowRight, Command, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { workspaceNavigation, type AppView } from "@/config/workspace-navigation";

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
  onTour: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onOpenChange]);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return workspaceNavigation;
    return workspaceNavigation.filter(({ label, description }) => `${label} ${description}`.toLowerCase().includes(term));
  }, [query]);
  useEffect(() => setActiveIndex(0), [query]);
  const runResult = (index: number) => {
    const result = results[index];
    if (!result) return;
    onNavigate(result.id);
    onOpenChange(false);
  };
  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => Math.min(current + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
    if (event.key === "Enter") runResult(activeIndex);
  };

  if (!open) return null;
  return <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#02030a]/80 px-4 pt-[12vh] backdrop-blur-md" role="presentation" onMouseDown={() => onOpenChange(false)}><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[.1] bg-[#0b0c1b]/95 shadow-[0_32px_120px_rgba(0,0,0,.65)]" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-white/[.07] px-4"><Search size={17} className="text-[#78e8ff]" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeys} placeholder="Jump to a workspace or action…" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-700" /><span className="rounded-md border border-white/[.08] px-1.5 py-1 text-[9px] text-slate-600">ESC</span></div><div className="max-h-[52vh] overflow-y-auto p-2"><p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-700">Workspaces</p>{results.map(({ id, label, description, icon: Icon, badge }, index) => <button key={id} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${index === activeIndex ? "bg-white/[.06]" : "hover:bg-white/[.045]"}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => runResult(index)}><span className="grid size-9 place-items-center rounded-xl border border-white/[.07] bg-white/[.025] text-slate-500 group-hover:text-[#78e8ff]"><Icon size={16} /></span><span className="min-w-0 flex-1"><strong className="block text-xs text-slate-300">{label}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-600">{description}</span></span>{badge && <span className="text-[9px] text-[#aaa5ff]">{badge}</span>}<ArrowRight size={13} className="text-slate-700" /></button>)}{!results.length && <div className="grid min-h-28 place-items-center text-xs text-slate-600">No matching workspace</div>}<div className="mt-2 border-t border-white/[.06] pt-2"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[.045]" onClick={() => { onTour(); onOpenChange(false); }}><span className="grid size-9 place-items-center rounded-xl bg-[#746cff]/10 text-[#aaa5ff]"><Sparkles size={16} /></span><span className="flex-1 text-xs text-slate-300">Start guided product tour</span><Command size={13} className="text-slate-700" /></button></div></div></div></div>;
}

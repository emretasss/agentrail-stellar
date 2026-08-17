import { Activity, ArrowRight, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityEvent } from "@/types/agentrail";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

export function RecentActivity({ events, onOpen }: { events: ActivityEvent[]; onOpen: () => void }) {
  return <section className="overflow-hidden rounded-2xl border border-white/[.09] bg-[#0b0d1c]/90"><header className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><div className="flex items-center gap-2"><Activity size={15} className="text-[#8fdcff]" /><h3 className="text-sm font-semibold text-white">Protocol activity</h3></div><p className="mt-1 text-xs text-[#9ba6bd]">Wallet and on-chain events from this workspace</p></div><Button size="sm" variant="ghost" onClick={onOpen}>Open log <ArrowRight size={12} /></Button></header><div className="divide-y divide-white/[.06]">{events.slice(0, 4).map((event) => <div key={event.id} className="flex items-start gap-3 px-5 py-3.5"><CircleDot size={12} className={`mt-1 shrink-0 ${event.tone === "error" ? "text-[#ff8f9c]" : event.tone === "warning" ? "text-[#ffbf69]" : "text-[#69e8b6]"}`} /><div className="min-w-0 flex-1"><strong className="block truncate text-xs font-medium text-[#e8edf8]">{event.label}</strong><p className="mt-1 truncate text-[10px] text-[#929db4]">{event.detail}</p></div><span className="shrink-0 font-mono text-[9px] text-[#7f8aa0]">{relativeTime(event.at)}</span></div>)}{!events.length && <div className="grid min-h-36 place-items-center text-xs text-[#929db4]">No activity recorded yet.</div>}</div></section>;
}

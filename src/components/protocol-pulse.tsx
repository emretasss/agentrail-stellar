import { Activity, Blocks, Radio, ShieldCheck, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProtocolPulseProps = {
  mode: "loading" | "live" | "demo" | "error";
  ledger: number | null;
  compact?: boolean;
};

const modeCopy = {
  loading: { label: "Synchronizing", detail: "Reading contract state", tone: "text-amber-300", dot: "bg-amber-300" },
  live: { label: "Protocol healthy", detail: "Soroban RPC responding", tone: "text-[#61f6c2]", dot: "bg-[#61f6c2]" },
  demo: { label: "Demo dataset", detail: "Transactions are simulated", tone: "text-[#78e8ff]", dot: "bg-[#78e8ff]" },
  error: { label: "RPC degraded", detail: "Contract read unavailable", tone: "text-red-300", dot: "bg-red-300" },
};

export function ProtocolPulse({ mode, ledger, compact = false }: ProtocolPulseProps) {
  const state = modeCopy[mode];
  const cells = [
    { icon: Radio, label: "Status", value: state.label, tone: state.tone },
    { icon: Blocks, label: "Latest ledger", value: ledger?.toLocaleString() ?? "—" },
    { icon: TimerReset, label: "Expected finality", value: "≈ 5 seconds" },
    { icon: ShieldCheck, label: "Custody model", value: "Contract controlled" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className={cn("size-1.5 rounded-full shadow-[0_0_8px_currentColor]", state.dot)} />
        {state.label}
        <span className="text-slate-700">·</span>
        Ledger {ledger?.toLocaleString() ?? "—"}
      </div>
    );
  }

  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-white/[.07] bg-[#080916]/75 backdrop-blur-xl" aria-label="Protocol pulse">
      <div className="flex items-center justify-between border-b border-white/[.055] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Activity size={14} className={state.tone} /> Protocol pulse
        </div>
        <Badge variant={mode === "live" ? "default" : "secondary"}>{state.detail}</Badge>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {cells.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="border-b border-r border-white/[.055] p-4 even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
            <Icon size={14} className={tone ?? "text-slate-600"} />
            <span className="mt-3 block text-[9px] font-semibold uppercase tracking-[.13em] text-slate-700">{label}</span>
            <strong className="mt-1 block text-xs font-medium text-slate-300">{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

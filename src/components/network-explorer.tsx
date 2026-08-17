import { Activity, Blocks, Copy, ExternalLink, Radio, Server, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtocolPulse } from "@/components/protocol-pulse";
import type { Job } from "@/types/agentrail";

const CONTRACT_ID = "CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5";

export function NetworkExplorer({
  mode,
  ledger,
  jobs,
  onRefresh,
}: {
  mode: "loading" | "live" | "demo" | "error";
  ledger: number | null;
  jobs: Job[];
  onRefresh: () => void;
}) {
  const chainJobs = jobs.filter((job) => job.chainBacked);
  const transactionCount = jobs.filter((job) => job.txHash).length;

  return (
    <div className="grid gap-3">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.075] bg-[#090a18] p-6 sm:p-8">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-[#78e8ff]/[.07] blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#78e8ff]"><Radio size={13} /> Stellar network explorer</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">See every trust transition.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A human-readable operational view of AgentRail’s contract, ledger position and settlement activity.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh}><Activity size={14} /> Refresh state</Button>
            <Button asChild><a href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} target="_blank" rel="noreferrer">Open explorer <ExternalLink size={13} /></a></Button>
          </div>
        </div>
      </section>

      <ProtocolPulse mode={mode} ledger={ledger} />

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-[#0b0d1c]/85 p-4 sm:flex-row sm:items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#756dff]/20 bg-[#756dff]/10 text-[#bcb8ff]"><Blocks size={16} /></span>
        <div className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#7f8aa0]">Deployed Testnet contract</span><code className="mt-1 block truncate text-xs text-[#cbd4e5]">{CONTRACT_ID}</code></div>
        <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(CONTRACT_ID); toast.success("Contract ID copied"); }}><Copy size={12} /> Copy contract</Button>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contract topology</CardTitle><p className="text-xs text-slate-600">Core actors and state boundaries</p></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                [Server, "Agent registry", "Profiles, pricing and owner authorization"],
                [ShieldCheck, "Escrow vault", "Funded value held by contract rules"],
                [Blocks, "Reputation state", "Settlement-backed ratings and history"],
              ].map(([Icon, title, copy], index) => {
                const NodeIcon = Icon as typeof Server;
                return <div key={String(title)} className="relative rounded-xl border border-white/[.06] bg-white/[.02] p-4"><span className="absolute right-3 top-3 font-mono text-[9px] text-slate-700">NODE-0{index + 1}</span><NodeIcon size={17} className="text-[#8f88ff]" /><strong className="mt-6 block text-sm text-slate-300">{String(title)}</strong><p className="mt-2 text-xs leading-5 text-slate-600">{String(copy)}</p></div>;
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Observed footprint</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Chain-backed missions", chainJobs.length],
              ["Known transaction hashes", transactionCount],
              ["Current ledger", ledger?.toLocaleString() ?? "—"],
            ].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between rounded-xl border border-white/[.055] bg-black/20 px-4 py-3"><span className="text-xs text-slate-500">{label}</span><strong className="font-mono text-sm text-slate-200">{value}</strong></div>)}
            <div className="rounded-xl border border-[#61f6c2]/10 bg-[#61f6c2]/[.035] p-4"><Zap size={15} className="text-[#61f6c2]" /><p className="mt-3 text-xs leading-5 text-slate-500">Final settlement is confirmed through Stellar RPC polling before local state is marked successful.</p></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

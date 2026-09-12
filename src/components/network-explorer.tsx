import { Activity, Blocks, Coins, Copy, ExternalLink, History, PauseCircle, Radio, Server, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtocolPulse } from "@/components/protocol-pulse";
import type { ContractEvent, Job, ProtocolGovernance, SettlementAsset } from "@/types/agentrail";
import { agentRailContractExplorerUrl, stellarConfig } from "@/lib/stellar";

export function NetworkExplorer({
  mode,
  ledger,
  jobs,
  assets,
  governance,
  events,
  onRefresh,
}: {
  mode: "loading" | "live" | "demo" | "error";
  ledger: number | null;
  jobs: Job[];
  assets: SettlementAsset[];
  governance: ProtocolGovernance;
  events: ContractEvent[];
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
            <Button asChild><a href={agentRailContractExplorerUrl} target="_blank" rel="noreferrer">Open explorer <ExternalLink size={13} /></a></Button>
          </div>
        </div>
      </section>

      <ProtocolPulse mode={mode} ledger={ledger} />

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-[#0b0d1c]/85 p-4 sm:flex-row sm:items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#756dff]/20 bg-[#756dff]/10 text-[#bcb8ff]"><Blocks size={16} /></span>
        <div className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase tracking-[.14em] text-[#7f8aa0]">Deployed Testnet contract</span><code className="mt-1 block truncate text-xs text-[#cbd4e5]">{stellarConfig.contractId}</code></div>
        <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(stellarConfig.contractId); toast.success("Contract ID copied"); }}><Copy size={12} /> Copy contract</Button>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contract topology</CardTitle><p className="text-xs text-slate-600">Core actors and state boundaries</p></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [Server, "Agent registry", "Profiles, pricing and owner authorization"],
                [ShieldCheck, "Escrow vault", "Funded value held by contract rules"],
                [Blocks, "Reputation state", "Settlement-backed ratings and history"],
                [Coins, "Asset router", "Allowlisted SEP-41 and Stellar Asset Contracts"],
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

      <section className="grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Protocol safety plane</CardTitle><p className="text-xs text-slate-600">On-chain controls exposed as readable state</p></CardHeader>
          <CardContent className="grid gap-3">
            <div className={`rounded-xl border p-4 ${governance.paused ? "border-amber-400/20 bg-amber-400/[.05]" : "border-emerald-400/15 bg-emerald-400/[.035]"}`}>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><PauseCircle size={14} /> Funding circuit breaker</span><Badge variant={governance.paused ? "warning" : "default"}>{governance.paused ? "Paused" : "Accepting funding"}</Badge></div>
              <p className="mt-2 text-[10px] leading-5 text-slate-600">A pause blocks new deposits while delivery, approval and refund exits remain available.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/[.06] bg-black/20 p-4"><span className="text-[9px] uppercase tracking-wider text-slate-600">Protocol ABI</span><strong className="mt-2 block text-lg text-white">v0.{governance.version}</strong></div>
              <div className="rounded-xl border border-white/[.06] bg-black/20 p-4"><span className="text-[9px] uppercase tracking-wider text-slate-600">Upgrade delay</span><strong className="mt-2 block text-lg text-white">{governance.minUpgradeDelayLedgers ? `${governance.minUpgradeDelayLedgers.toLocaleString()} ledgers` : "Legacy"}</strong></div>
            </div>
            <div className="rounded-xl border border-white/[.06] bg-black/20 p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">Pending WASM upgrade</span><Badge variant={governance.upgradePending ? "warning" : "secondary"}>{governance.upgradePending ? "Timelock active" : "None"}</Badge></div>{governance.upgradePending && <code className="mt-2 block truncate text-[9px] text-slate-600">{governance.upgradeWasmHash}</code>}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Settlement asset registry</CardTitle><p className="text-xs text-slate-600">Every funding route must be explicitly allowlisted on-chain</p></CardHeader>
          <CardContent className="grid gap-2">
            {assets.map((asset) => (
              <div key={asset.token} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/20 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#756dff]/20 bg-[#756dff]/10 text-[#bcb8ff]"><Coins size={14} /></span>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="text-sm text-white">{asset.code}</strong><Badge variant={asset.enabled ? "default" : "secondary"}>{asset.enabled ? "Enabled" : "Disabled"}</Badge></div><code className="mt-1 block truncate text-[9px] text-slate-600">{asset.token}</code></div>
                <span className="text-[9px] text-slate-600">{asset.decimals} decimals</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><History size={14} className="text-cyan-300" /> Soroban event stream</CardTitle><p className="text-xs text-slate-600">Recent contract events read directly from Stellar RPC; transaction links are independently verifiable.</p></CardHeader>
        <CardContent className="grid gap-2">
          {!events.length ? <div className="rounded-xl border border-dashed border-white/[.08] p-6 text-center text-xs text-slate-600">No contract events are available inside the RPC retention window.</div> : events.slice(0, 12).map((event) => (
            <div key={event.id} className="grid gap-2 rounded-xl border border-white/[.06] bg-black/20 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
              <div><span className="block text-[9px] uppercase tracking-wider text-slate-600">Ledger {event.ledger.toLocaleString()}</span><strong className="mt-1 block text-xs text-cyan-200">{event.family} / {event.action}</strong></div>
              <code className="truncate text-[9px] text-slate-600" title={event.detail}>{event.detail}</code>
              <Button asChild variant="outline" size="sm"><a href={`${stellarConfig.explorerBaseUrl}/tx/${event.txHash}`} target="_blank" rel="noreferrer">Verify <ExternalLink size={11} /></a></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Protocol endpoints</CardTitle><p className="text-xs text-slate-600">Runtime addresses used by the current deployment</p></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          {[["Soroban RPC", stellarConfig.rpcUrl], ["Native XLM SAC", stellarConfig.nativeTokenContractId], ["Read source", stellarConfig.readSource]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[.065] bg-white/[.025] p-4"><span className="block text-[9px] font-bold uppercase tracking-[.13em] text-[#7f8aa0]">{label}</span><code className="mt-2 block truncate text-[10px] text-[#b8c2d5]" title={value}>{value}</code></div>)}
        </CardContent>
      </Card>
    </div>
  );
}

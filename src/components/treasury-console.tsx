import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Coins, LockKeyhole, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decimalFromStroops } from "@/lib/stellar";
import type { Job } from "@/types/agentrail";
import { SettlementHealth } from "@/components/settlement-health";
import { useState } from "react";
import type { JobStatus } from "@/types/agentrail";

export function TreasuryConsole({ jobs }: { jobs: Job[] }) {
  const [ledgerStatus, setLedgerStatus] = useState<JobStatus | "All">("All");
  const locked = jobs.filter((job) => job.status === "Funded" || job.status === "Delivered");
  const released = jobs.filter((job) => job.status === "Released");
  const refunded = jobs.filter((job) => job.status === "Refunded");
  const sum = (items: Job[]) => items.reduce((total, job) => total + job.amountStroops, 0n);
  const total = sum(jobs);
  const ledgerJobs = jobs.filter((job) => ledgerStatus === "All" || job.status === ledgerStatus);
  const flows = [
    { label: "Protected in escrow", value: sum(locked), icon: LockKeyhole, tone: "text-[#aaa5ff]", direction: "in" },
    { label: "Released to agents", value: sum(released), icon: ArrowUpRight, tone: "text-[#61f6c2]", direction: "out" },
    { label: "Returned to buyers", value: sum(refunded), icon: ArrowDownRight, tone: "text-[#78e8ff]", direction: "out" },
  ];

  return (
    <div className="grid gap-3">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.075] bg-[#090a18] p-6 sm:p-8">
        <div className="absolute -right-12 -top-20 size-64 rounded-full bg-[#61f6c2]/[.07] blur-3xl" />
        <div className="relative"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#61f6c2]"><Coins size={13} /> Protocol treasury</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">Follow value, not vanity metrics.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A transparent view of XLM moving into protection, successful settlement and buyer recovery.</p></div>
      </section>

      <SettlementHealth jobs={jobs} />

      <section className="grid gap-3 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="overflow-hidden">
          <CardContent className="relative flex min-h-72 flex-col p-6"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(116,108,255,.11),transparent_38%)]" /><div className="relative flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#746cff]/10 text-[#aaa5ff]"><WalletCards size={18} /></span><Badge variant="secondary">All-time protocol</Badge></div><div className="relative mt-auto"><span className="text-[10px] uppercase tracking-[.15em] text-slate-600">Gross mission volume</span><strong className="mt-2 block text-4xl font-semibold tracking-[-.05em] text-white">{decimalFromStroops(total)} <small className="text-sm font-medium text-slate-500">XLM</small></strong><p className="mt-3 text-xs leading-5 text-slate-600">Computed directly from the currently loaded mission state.</p></div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Value routes</CardTitle><p className="text-xs text-slate-600">Contract-controlled cash flow states</p></CardHeader>
          <CardContent className="grid gap-2">
            {flows.map(({ label, value, icon: Icon, tone, direction }) => {
              const share = total > 0n ? Math.round((Number(value) / Number(total)) * 100) : 0;
              return <div key={label} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl bg-white/[.035] ${tone}`}><Icon size={16} /></span><div className="min-w-0 flex-1"><span className="block text-xs text-slate-500">{label}</span><strong className="mt-1 block text-sm text-slate-200">{decimalFromStroops(value)} XLM</strong></div><Badge variant={direction === "in" ? "warning" : "secondary"}>{share}%</Badge></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[.04]"><div className="h-full rounded-full bg-gradient-to-r from-[#746cff] to-[#61f6c2]" style={{ width: `${Math.max(share, value > 0n ? 4 : 0)}%` }} /></div></div>;
            })}
          </CardContent>
        </Card>
      </section>

      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-sm">Settlement ledger</CardTitle><p className="mt-1 text-xs text-[#929db4]">Inspect value by contract state</p></div><select aria-label="Filter settlement ledger" value={ledgerStatus} onChange={(event) => setLedgerStatus(event.target.value as typeof ledgerStatus)} className="h-8 rounded-lg border border-white/[.08] bg-[#090b18] px-2.5 text-[10px] text-[#a8b2c6] outline-none"><option value="All">All routes</option>{(["Funded", "Delivered", "Released", "Refunded", "Disputed"] as JobStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}</select></CardHeader><CardContent className="overflow-x-auto px-0"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-y border-white/[.06] text-[9px] uppercase tracking-[.13em] text-slate-700"><th className="px-5 py-3">Mission</th><th className="px-3 py-3">Route</th><th className="px-3 py-3">Value</th><th className="px-5 py-3 text-right">Integrity</th></tr></thead><tbody>{ledgerJobs.map((job) => <tr key={job.id} className="border-b border-white/[.045]"><td className="px-5 py-3.5 font-mono text-slate-400">AR-{String(job.id).padStart(4, "0")}</td><td className="px-3 py-3.5 text-slate-500">{job.status}</td><td className="px-3 py-3.5 text-slate-300">{decimalFromStroops(job.amountStroops)} XLM</td><td className="px-5 py-3.5 text-right"><span className="inline-flex items-center gap-1.5 text-[10px] text-[#61f6c2]"><CircleDollarSign size={11} /> Contract tracked</span></td></tr>)}</tbody></table>{!ledgerJobs.length && <div className="grid min-h-32 place-items-center border-t border-white/[.05] text-xs text-[#929db4]">No value has entered this route yet.</div>}</CardContent></Card>
    </div>
  );
}

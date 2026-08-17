import {
  Check,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Download,
  FileCheck2,
  LockKeyhole,
  RotateCcw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decimalFromStroops } from "@/lib/stellar";
import { cn } from "@/lib/utils";
import type { ActivityEvent, Agent, Job, JobStatus } from "@/types/agentrail";
import { DeadlineHealth } from "@/components/deadline-health";
import { activityToCsv, downloadTextFile } from "@/lib/export";
import { Input } from "@/components/ui/input";

const statusVariant: Record<JobStatus, "default" | "secondary" | "warning" | "destructive"> = {
  Funded: "secondary",
  Delivered: "warning",
  Released: "default",
  Refunded: "destructive",
  Disputed: "destructive",
};

export function JobActivity({
  jobs,
  agents,
  events,
  busy,
  walletAddress,
  latestLedger,
  onDeliver,
  onApprove,
  onRefund,
  onDispute,
}: {
  jobs: Job[];
  agents: Agent[];
  events: ActivityEvent[];
  busy: string | null;
  walletAddress?: string;
  latestLedger: number | null;
  onDeliver: (job: Job) => void;
  onApprove: (job: Job) => void;
  onRefund: (job: Job) => void;
  onDispute: (job: Job) => void;
}) {
  const [status, setStatus] = useState<JobStatus | "All">("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"attention" | "newest" | "value">("attention");
  const visibleJobs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return jobs.filter((job) => status === "All" || job.status === status).filter((job) => {
      const agent = agents.find((entry) => entry.id === job.agentId);
      return !term || `${job.id} ${job.brief} ${agent?.name ?? ""} ${agent?.handle ?? ""}`.toLowerCase().includes(term);
    }).sort((a, b) => {
      if (sort === "value") return Number(b.amountStroops - a.amountStroops);
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      const rank: Record<JobStatus, number> = { Delivered: 0, Disputed: 1, Funded: 2, Released: 3, Refunded: 4 };
      return rank[a.status] - rank[b.status];
    });
  }, [agents, jobs, query, sort, status]);
  const statusFilters: Array<JobStatus | "All"> = ["All", "Funded", "Delivered", "Released", "Refunded", "Disputed"];
  return (
    <section className="grid gap-3 xl:grid-cols-[1.4fr_.75fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Active jobs</CardTitle>
            <p className="mt-1 text-xs text-slate-600">Escrow lifecycle and delivery queue</p>
          </div>
          <Badge variant="secondary">{visibleJobs.length} shown</Badge>
        </CardHeader>
        <div className="flex flex-col gap-3 border-t border-white/[.055] px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-60"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8aa0]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search mission or agent" aria-label="Search missions" className="h-8 pl-8 text-[10px]" /></div>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {statusFilters.map((item) => {
            const count = item === "All" ? jobs.length : jobs.filter((job) => job.status === item).length;
            return <button key={item} onClick={() => setStatus(item)} className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold transition", status === item ? "border-[#746cff]/30 bg-[#746cff]/10 text-[#b9b5ff]" : "border-white/[.06] text-slate-600 hover:text-slate-300")}>{item} <span className="ml-1 opacity-60">{count}</span></button>;
          })}
          </div>
          <select aria-label="Sort missions" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-8 shrink-0 rounded-lg border border-white/[.08] bg-[#090b18] px-2.5 text-[10px] text-[#a8b2c6] outline-none"><option value="attention">Needs attention</option><option value="newest">Newest first</option><option value="value">Highest value</option></select>
        </div>
        <CardContent className="overflow-x-auto px-0 pb-1">
          <div className="grid gap-2 px-3 pb-3 md:hidden">
            {visibleJobs.map((job) => {
              const agent = agents.find((entry) => entry.id === job.agentId);
              const isPayer = Boolean(walletAddress) && job.payer === walletAddress;
              const canDeliver = job.status === "Funded" && Boolean(walletAddress) && agent?.owner === walletAddress;
              const canApprove = job.status === "Delivered" && isPayer;
              const canRefund = job.status === "Funded" && isPayer && Boolean(latestLedger && job.deadlineLedger) && latestLedger! > job.deadlineLedger!;
              return <article key={job.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-start justify-between gap-3"><div><strong className="font-mono text-xs text-slate-300">AR-{String(job.id).padStart(4, "0")}</strong><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-600">{job.brief}</p></div><Badge variant={statusVariant[job.status]}>{job.status}</Badge></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-black/20 p-2.5"><span className="block text-[8px] uppercase tracking-wider text-slate-700">Agent</span><strong className="mt-1 block truncate text-[10px] text-slate-400">@{agent?.handle ?? "unknown"}</strong></div><div className="rounded-lg bg-black/20 p-2.5"><span className="block text-[8px] uppercase tracking-wider text-slate-700">Escrow</span><strong className="mt-1 block text-[10px] text-slate-300">{decimalFromStroops(job.amountStroops)} XLM</strong></div></div><div className="mt-3"><DeadlineHealth deadline={job.deadlineLedger} current={latestLedger} /></div>{(canDeliver || canApprove || canRefund) && <div className="mt-3 flex gap-2">{canDeliver && <Button size="sm" variant="outline" className="flex-1" onClick={() => onDeliver(job)}><FileCheck2 size={12} /> Deliver</Button>}{canApprove && <Button size="sm" className="flex-1" onClick={() => onApprove(job)}><Check size={12} /> Release</Button>}{canRefund && <Button size="sm" variant="outline" className="flex-1" onClick={() => onRefund(job)}><RotateCcw size={12} /> Refund</Button>}</div>}</article>;
            })}
          </div>
          <table className="hidden w-full min-w-[680px] text-left md:table">
            <thead>
              <tr className="border-y border-white/[.06] text-[10px] uppercase tracking-[.12em] text-slate-600">
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-3 py-3 font-medium">Agent</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => {
                const agent = agents.find((entry) => entry.id === job.agentId);
                const canDeliver =
                  job.status === "Funded" &&
                  Boolean(walletAddress) &&
                  agent?.owner === walletAddress;
                const canApprove =
                  job.status === "Delivered" &&
                  Boolean(walletAddress) &&
                  job.payer === walletAddress;
                const isPayer = Boolean(walletAddress) && job.payer === walletAddress;
                const canRefund =
                  job.status === "Funded" &&
                  isPayer &&
                  Boolean(latestLedger && job.deadlineLedger) &&
                  latestLedger! > job.deadlineLedger!;
                const canDispute =
                  isPayer &&
                  (job.status === "Funded" || job.status === "Delivered");
                return (
                  <tr key={job.id} className="border-b border-white/[.045] text-xs last:border-0">
                    <td className="px-5 py-3.5">
                      <strong className="block font-medium text-slate-300">JOB-{String(job.id).padStart(4, "0")}</strong>
                      <span className="mt-0.5 block max-w-48 truncate text-[10px] text-slate-600">
                        {job.brief}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-slate-400">@{agent?.handle ?? "unknown"}</span>
                    </td>
                    <td className="px-3 py-3.5"><DeadlineHealth deadline={job.deadlineLedger} current={latestLedger} /></td>
                    <td className="px-3 py-3.5 font-medium text-slate-300">
                      {decimalFromStroops(job.amountStroops)} XLM
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge variant={statusVariant[job.status]}>
                        <CircleDot size={9} />
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                      {canDeliver && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `deliver-${job.id}`}
                          onClick={() => onDeliver(job)}
                        >
                          <FileCheck2 size={13} />
                          Deliver
                        </Button>
                      )}
                      {canApprove && (
                        <Button
                          size="sm"
                          disabled={busy === `approve-${job.id}`}
                          onClick={() => onApprove(job)}
                        >
                          <Check size={13} />
                          Release
                        </Button>
                      )}
                      {canRefund && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `refund-${job.id}`}
                          onClick={() => onRefund(job)}
                        >
                          <RotateCcw size={12} />
                          Refund
                        </Button>
                      )}
                      {canDispute && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === `dispute-${job.id}`}
                          onClick={() => onDispute(job)}
                          aria-label={`Dispute job ${job.id}`}
                        >
                          <TriangleAlert size={12} />
                        </Button>
                      )}
                      {job.status === "Funded" && !canDeliver && !canRefund && !canDispute && (
                        <span className="text-[10px] text-slate-600">Agent action</span>
                      )}
                      {job.status === "Delivered" && !canApprove && !canDispute && (
                        <span className="text-[10px] text-slate-600">Buyer action</span>
                      )}
                      {job.txHash && job.status !== "Delivered" && job.status !== "Funded" && (
                        <Button asChild size="sm" variant="ghost">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${job.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Explorer <ExternalLink size={12} />
                          </a>
                        </Button>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visibleJobs.length && <div className="grid min-h-40 place-items-center border-t border-white/[.05] text-center"><div><CircleDot className="mx-auto text-slate-700" size={20} /><p className="mt-3 text-xs text-slate-500">No {status.toLowerCase()} missions yet.</p><button onClick={() => setStatus("All")} className="mt-1 text-[10px] text-[#78e8ff]">Show all missions</button></div></div>}
        </CardContent>
      </Card>

      <Card id="activity" className="scroll-mt-20">
        <CardHeader className="flex-row items-start justify-between">
          <div><CardTitle className="text-sm">Live activity</CardTitle>
          <p className="text-xs text-slate-600">Local product and on-chain events</p></div>
          <Button size="sm" variant="ghost" aria-label="Export activity as CSV" onClick={() => downloadTextFile("agentrail-activity.csv", activityToCsv(events), "text/csv;charset=utf-8")}><Download size={12} /> CSV</Button>
        </CardHeader>
        <CardContent className="grid gap-1">
          {events.slice(0, 5).map((event, index) => (
            <div key={event.id} className="relative flex gap-3 py-2.5">
              {index < Math.min(events.length, 5) - 1 && (
                <span className="absolute left-[7px] top-8 h-[calc(100%-14px)] w-px bg-white/[.07]" />
              )}
              <span
                className={cn(
                  "relative mt-1 grid size-4 shrink-0 place-items-center rounded-full border",
                  event.tone === "error"
                    ? "border-red-400/30 bg-red-400/10 text-red-300"
                    : event.tone === "warning"
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                )}
              >
                {event.tone === "success" ? <CheckCircle2 size={9} /> : <LockKeyhole size={8} />}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-xs font-medium text-slate-300">{event.label}</strong>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-600">{event.detail}</p>
                <span className="mt-1 block text-[9px] text-slate-700">
                  {new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <p className="mt-1 text-[10px] text-slate-700">
            Showing {Math.min(events.length, 5)} of {events.length} recorded events
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

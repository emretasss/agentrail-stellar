import {
  Check,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  FileCheck2,
  LockKeyhole,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decimalFromStroops } from "@/lib/stellar";
import { cn } from "@/lib/utils";
import type { ActivityEvent, Agent, Job, JobStatus } from "@/types/agentrail";

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
  onDeliver,
  onApprove,
}: {
  jobs: Job[];
  agents: Agent[];
  events: ActivityEvent[];
  busy: string | null;
  walletAddress?: string;
  onDeliver: (job: Job) => void;
  onApprove: (job: Job) => void;
}) {
  return (
    <section className="grid gap-3 xl:grid-cols-[1.4fr_.75fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Active jobs</CardTitle>
            <p className="mt-1 text-xs text-slate-600">Escrow lifecycle and delivery queue</p>
          </div>
          <Badge variant="secondary">{jobs.length} total</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-1">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-y border-white/[.06] text-[10px] uppercase tracking-[.12em] text-slate-600">
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-3 py-3 font-medium">Agent</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const agent = agents.find((entry) => entry.id === job.agentId);
                const canDeliver =
                  job.status === "Funded" &&
                  Boolean(walletAddress) &&
                  agent?.owner === walletAddress;
                const canApprove =
                  job.status === "Delivered" &&
                  Boolean(walletAddress) &&
                  job.payer === walletAddress;
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
                      {job.status === "Funded" && !canDeliver && (
                        <span className="text-[10px] text-slate-600">Agent action</span>
                      )}
                      {job.status === "Delivered" && !canApprove && (
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card id="activity" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-sm">Live activity</CardTitle>
          <p className="text-xs text-slate-600">Local product and on-chain events</p>
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

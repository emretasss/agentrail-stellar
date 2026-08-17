import {
  Bot,
  CircleDollarSign,
  Clock3,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtocolPulse } from "@/components/protocol-pulse";
import { MissionFunnel } from "@/components/mission-funnel";
import type { Job } from "@/types/agentrail";

type Stats = {
  agents: number;
  jobs: number;
  locked: string;
  released: string;
};

const metricStyle = [
  {
    key: "locked" as const,
    label: "Value in escrow",
    suffix: " XLM",
    icon: LockKeyhole,
    accent: "violet",
  },
  {
    key: "released" as const,
    label: "Settled volume",
    suffix: " XLM",
    icon: CircleDollarSign,
    accent: "mint",
  },
  {
    key: "jobs" as const,
    label: "Total jobs",
    suffix: "",
    icon: Clock3,
    accent: "cyan",
  },
  {
    key: "agents" as const,
    label: "Active agents",
    suffix: "",
    icon: Bot,
    accent: "rose",
  },
];

export function DashboardOverview({
  stats,
  dataMode,
  latestLedger,
  jobs,
  onCreateJob,
  onRegisterAgent,
  onRefresh,
}: {
  stats: Stats;
  dataMode: "loading" | "live" | "demo" | "error";
  latestLedger: number | null;
  jobs: Job[];
  onCreateJob: () => void;
  onRegisterAgent: () => void;
  onRefresh: () => void;
}) {
  const lifecycle = [
    { label: "Registered agents", value: stats.agents, icon: Bot },
    { label: "Jobs created", value: stats.jobs, icon: Clock3 },
    { label: "XLM settled", value: stats.released, icon: CircleDollarSign },
  ];

  return (
    <>
      <section className="workspace-hero relative mb-5 flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-white/[.075] p-5 sm:p-6 xl:flex-row xl:items-end">
        <div className="workspace-hero-orb" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#78e8ff]">
            <Sparkles size={14} />
            Autonomous commerce protocol
          </div>
          <h2 className="max-w-3xl text-2xl font-semibold tracking-[-0.035em] text-slate-50 sm:text-3xl">
            Command the <span className="workspace-gradient-text">agent economy.</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Discover verified services, protect every payment with Soroban escrow,
            and build portable on-chain reputation.
          </p>
        </div>
        <div className="relative flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onRegisterAgent}>
            <Bot size={16} />
            Publish an agent
          </Button>
          <Button onClick={onCreateJob}>
            <Plus size={16} />
            Create a job
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricStyle.map(({ key, label, suffix, icon: Icon, accent }) => (
          <Card key={key} className={`metric-card metric-card-${accent} group overflow-hidden`}>
            <CardContent className="relative p-4">
              <div className="metric-card-line absolute inset-x-0 top-0 h-px opacity-70 transition group-hover:opacity-100" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100">
                    {stats[key]}
                    <span className="ml-1 text-xs font-normal text-slate-600">{suffix}</span>
                  </p>
                </div>
                <span className="metric-card-icon grid size-9 place-items-center rounded-xl border">
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-3 text-[11px] text-slate-600">
                {dataMode === "live" ? "Verified contract state" : "Current workspace state"}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1.6fr_.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Protocol lifecycle</CardTitle>
              <p className="mt-1 text-xs text-slate-600">
                Current aggregate state from the AgentRail contract
              </p>
            </div>
            <Badge variant={dataMode === "live" ? "default" : "secondary"}>
              {dataMode === "live" ? "Live" : dataMode}
            </Badge>
          </CardHeader>
          <CardContent className="grid min-h-[218px] gap-3 p-4 sm:grid-cols-3">
            {lifecycle.map(({ label, value, icon: Icon }, index) => (
              <div
                key={label}
                className={`lifecycle-node lifecycle-node-${index + 1} relative flex min-h-36 flex-col justify-between overflow-hidden rounded-xl border border-white/[.07] bg-white/[.02] p-4`}
              >
                <span className="lifecycle-icon grid size-8 place-items-center rounded-lg">
                  <Icon size={15} />
                </span>
                <div>
                  <strong className="block text-2xl font-semibold tracking-tight text-slate-100">
                    {value}
                  </strong>
                  <span className="mt-1 block text-[11px] text-slate-600">{label}</span>
                </div>
                {index < lifecycle.length - 1 && (
                  <span className="absolute right-2 top-1/2 hidden text-slate-800 sm:block">
                    →
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="relative flex h-full min-h-[280px] flex-col p-5">
            <div className="absolute -right-14 -top-20 size-44 rounded-full bg-emerald-400/[.08] blur-3xl" />
            <div className="relative flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                <ShieldCheck size={18} />
              </span>
              <Badge variant={dataMode === "live" ? "default" : "secondary"}>
                {dataMode === "live" ? "Operational" : "Checking"}
              </Badge>
            </div>
            <div className="relative mt-auto">
              <p className="text-xs font-medium uppercase tracking-[.16em] text-slate-600">
                Network assurance
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-100">
                {dataMode === "live" ? "Contract state verified" : "Connecting to Testnet"}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Contract reachable, signing network verified, and confirmation polling active.
              </p>
              {dataMode === "error" && (
                <Button className="mt-4" size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw size={13} />
                  Retry contract read
                </Button>
              )}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["RPC", dataMode === "live" ? "Connected" : "Checking"],
                  ["Ledger", latestLedger?.toLocaleString() ?? "—"],
                  ["Network", "Testnet"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/[.06] bg-white/[.025] p-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-600">{label}</span>
                    <strong className="mt-1 block text-[11px] text-slate-300">{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <ProtocolPulse mode={dataMode} ledger={latestLedger} />
      <MissionFunnel jobs={jobs} />
    </>
  );
}

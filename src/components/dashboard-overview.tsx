import {
  ArrowRight,
  Bot,
  CircleDollarSign,
  Clock3,
  LockKeyhole,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { PlaybookShelf } from "@/components/dashboard/playbook-shelf";
import { AgentWatchlist } from "@/components/dashboard/agent-watchlist";
import { ProtocolPulse } from "@/components/protocol-pulse";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import type { MissionPlaybook } from "@/data/mission-playbooks";
import type { ActivityEvent, Agent, Job } from "@/types/agentrail";

type Stats = { agents: number; jobs: number; locked: string; released: string };

const metricStyle = [
  { key: "locked" as const, label: "Protected now", suffix: " XLM", icon: LockKeyhole, accent: "violet", hint: "Live escrow value" },
  { key: "released" as const, label: "Settled volume", suffix: " XLM", icon: CircleDollarSign, accent: "mint", hint: "Released to agents" },
  { key: "jobs" as const, label: "Missions", suffix: "", icon: Clock3, accent: "cyan", hint: "Across every state" },
  { key: "agents" as const, label: "Verified agents", suffix: "", icon: Bot, accent: "rose", hint: "Active on the network" },
];

export function DashboardOverview({
  stats,
  dataMode,
  latestLedger,
  jobs,
  agents,
  events,
  onCreateJob,
  onRegisterAgent,
  onRefresh,
  onOpenJobs,
  onOpenAgents,
  onOpenLibrary,
  onOpenCopilot,
  onUsePlaybook,
  onHireAgent,
}: {
  stats: Stats;
  dataMode: "loading" | "live" | "demo" | "error";
  latestLedger: number | null;
  jobs: Job[];
  agents: Agent[];
  events: ActivityEvent[];
  onCreateJob: () => void;
  onRegisterAgent: () => void;
  onRefresh: () => void;
  onOpenJobs: () => void;
  onOpenAgents: () => void;
  onOpenLibrary: () => void;
  onOpenCopilot: () => void;
  onUsePlaybook: (playbook: MissionPlaybook) => void;
  onHireAgent: (agent: Agent) => void;
}) {
  const attentionCount = jobs.filter((job) => job.status === "Delivered" || job.status === "Disputed").length;

  return (
    <div className="grid gap-4">
      <section className="dashboard-command-hero relative overflow-hidden rounded-2xl border border-white/[.1] px-5 py-6 sm:px-7 sm:py-8">
        <div className="dashboard-command-grid" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-[#69e8b6]/20 bg-[#69e8b6]/[.08] text-[#8df0c8]"><Radio size={10} className="animate-pulse" /> Stellar Testnet live</Badge>
              {attentionCount > 0 && <Badge variant="warning">{attentionCount} mission{attentionCount === 1 ? "" : "s"} need attention</Badge>}
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Put AI work on <span className="workspace-gradient-text">verifiable rails.</span></h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a8b2c6] sm:text-[15px]">Start from a proven mission template, hire a settlement-ranked agent, and release XLM only when the evidence meets your terms.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[390px]">
            <Button size="lg" variant="outline" onClick={onOpenCopilot} className="h-12 rounded-xl border-white/[.12] bg-white/[.045]"><WandSparkles size={16} className="text-[#bcb8ff]" /> Design with AI</Button>
            <Button size="lg" onClick={onCreateJob} className="h-12 rounded-xl"><Plus size={16} /> Start mission</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Protocol metrics">
        {metricStyle.map(({ key, label, suffix, icon: Icon, accent, hint }) => (
          <Card key={key} className={`metric-card metric-card-${accent} group overflow-hidden`}>
            <CardContent className="relative p-5">
              <div className="metric-card-line absolute inset-x-0 top-0 h-px opacity-80" />
              <div className="flex items-start justify-between"><div><p className="text-[11px] font-medium text-[#9ba6bd]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f3f6ff]">{stats[key]}<span className="ml-1 text-xs font-medium text-[#8d98ae]">{suffix}</span></p></div><span className="metric-card-icon grid size-10 place-items-center rounded-xl border"><Icon size={16} /></span></div>
              <p className="mt-4 text-[10px] font-medium text-[#7f8ba1]">{dataMode === "live" ? hint : "Current workspace state"}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <ActionQueue jobs={jobs} agents={agents} onOpenJobs={onOpenJobs} />
        <div className="grid gap-4">
          <Card className="overflow-hidden border-[#69e8b6]/[.12]">
            <CardContent className="relative p-5">
              <div className="absolute -right-16 -top-20 size-48 rounded-full bg-[#69e8b6]/[.08] blur-3xl" />
              <div className="relative flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl border border-[#69e8b6]/15 bg-[#69e8b6]/[.08] text-[#69e8b6]"><ShieldCheck size={18} /></span><Badge variant={dataMode === "live" ? "default" : "secondary"}>{dataMode === "live" ? "Operational" : "Checking"}</Badge></div>
              <div className="relative mt-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#7f8ba1]">Network assurance</p><h3 className="mt-2 text-lg font-semibold text-white">{dataMode === "live" ? "Contract state verified" : "Connecting to Testnet"}</h3><p className="mt-2 text-xs leading-5 text-[#9ba6bd]">RPC state, wallet network and ledger confirmation are checked before every settlement.</p></div>
              <div className="relative mt-5 grid grid-cols-3 gap-2">{[["RPC", dataMode === "live" ? "Connected" : "Checking"], ["Ledger", latestLedger?.toLocaleString() ?? "—"], ["Finality", "≈ 5 sec"]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[.07] bg-white/[.03] p-2.5"><span className="block text-[8px] font-bold uppercase tracking-wider text-[#778298]">{label}</span><strong className="mt-1.5 block truncate text-[10px] text-[#d5dceb]">{value}</strong></div>)}</div>
              {dataMode === "error" && <Button className="relative mt-4" size="sm" variant="outline" onClick={onRefresh}><RefreshCw size={13} /> Retry contract read</Button>}
            </CardContent>
          </Card>
          <button onClick={onRegisterAgent} className="group flex items-center gap-3 rounded-2xl border border-dashed border-white/[.12] bg-white/[.018] p-4 text-left transition hover:border-[#756dff]/35 hover:bg-[#756dff]/[.04]"><span className="grid size-10 place-items-center rounded-xl bg-[#756dff]/10 text-[#bcb8ff]"><Bot size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#e6ebf7]">Build agents?</strong><span className="mt-1 block text-xs text-[#929db4]">Publish an owned service profile on Stellar.</span></span><ArrowRight size={14} className="text-[#69748a] transition group-hover:translate-x-1" /></button>
        </div>
      </section>

      <PlaybookShelf onBrowse={onOpenLibrary} onUse={onUsePlaybook} />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <AgentWatchlist agents={agents} onBrowse={onOpenAgents} onHire={onHireAgent} />
        <RecentActivity events={events} onOpen={onOpenJobs} />
      </section>

      <ProtocolPulse mode={dataMode} ledger={latestLedger} />
    </div>
  );
}

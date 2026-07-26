import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Clock3,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { volumeSeries } from "@/data/demo";

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
    change: "+18.2%",
    icon: LockKeyhole,
    up: true,
  },
  {
    key: "released" as const,
    label: "Settled volume",
    suffix: " XLM",
    change: "+24.8%",
    icon: CircleDollarSign,
    up: true,
  },
  {
    key: "jobs" as const,
    label: "Total jobs",
    suffix: "",
    change: "+12.4%",
    icon: Clock3,
    up: true,
  },
  {
    key: "agents" as const,
    label: "Active agents",
    suffix: "",
    change: "0.8%",
    icon: Bot,
    up: false,
  },
];

export function DashboardOverview({
  stats,
  onCreateJob,
  onRegisterAgent,
}: {
  stats: Stats;
  onCreateJob: () => void;
  onRegisterAgent: () => void;
}) {
  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
            <Sparkles size={14} />
            Autonomous commerce on Stellar
          </div>
          <h2 className="max-w-3xl text-2xl font-semibold tracking-[-0.035em] text-slate-50 sm:text-3xl">
            Trust infrastructure for the agent economy.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Discover verified services, protect every payment with Soroban escrow,
            and build portable on-chain reputation.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
        {metricStyle.map(({ key, label, suffix, change, icon: Icon, up }) => (
          <Card key={key} className="group overflow-hidden">
            <CardContent className="relative p-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100">
                    {stats[key]}
                    <span className="ml-1 text-xs font-normal text-slate-600">{suffix}</span>
                  </p>
                </div>
                <span className="grid size-8 place-items-center rounded-lg border border-white/[.07] bg-white/[.035] text-slate-500">
                  <Icon size={15} />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px]">
                <span className={up ? "text-emerald-400" : "text-amber-300"}>
                  {up ? <ArrowUpRight className="inline" size={12} /> : <ArrowDownRight className="inline" size={12} />}
                  {change}
                </span>
                <span className="text-slate-600">vs. last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1.6fr_.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Protocol activity</CardTitle>
              <p className="mt-1 text-xs text-slate-600">Escrow volume · trailing 7 days</p>
            </div>
            <Badge variant="secondary">7D</Badge>
          </CardHeader>
          <CardContent className="h-[218px] px-2 pb-2 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeSeries} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.045)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <ChartTooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value} XLM`, "Volume"]}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#volumeFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="relative flex h-full min-h-[280px] flex-col p-5">
            <div className="absolute -right-14 -top-20 size-44 rounded-full bg-emerald-400/[.08] blur-3xl" />
            <div className="relative flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                <ShieldCheck size={18} />
              </span>
              <Badge>Operational</Badge>
            </div>
            <div className="relative mt-auto">
              <p className="text-xs font-medium uppercase tracking-[.16em] text-slate-600">
                Network assurance
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-100">All systems nominal</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Contract reachable, signing network verified, and confirmation polling active.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["RPC", "99.98%"],
                  ["Finality", "~5s"],
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
    </>
  );
}

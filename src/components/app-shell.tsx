import {
  Activity,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WalletState } from "@/lib/stellar";

export type AppView = "overview" | "discover" | "jobs" | "copilot" | "growth" | "validation";

const viewMeta: Record<AppView, { title: string; subtitle: string }> = {
  overview: {
    title: "Command center",
    subtitle: "Live protocol health, settlement and reputation",
  },
  discover: {
    title: "Agent network",
    subtitle: "Discover and hire verifiable AI services",
  },
  jobs: {
    title: "Escrow operations",
    subtitle: "Manage funding, delivery and settlement",
  },
  copilot: {
    title: "Mission Copilot",
    subtitle: "Design a measurable agent mission with AI",
  },
  growth: {
    title: "Growth Lab",
    subtitle: "Complete, verify and share a real Testnet mission",
  },
  validation: {
    title: "Validation hub",
    subtitle: "Track Level 5 growth, feedback and real-user evidence",
  },
};

export function shortAddress(value: string, size = 5) {
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}

export function AppShell({
  children,
  wallet,
  connecting,
  jobCount,
  activeView,
  dataMode,
  onNavigate,
  onConnect,
  onOpenOnboarding,
}: {
  children: React.ReactNode;
  wallet: WalletState | null;
  connecting: boolean;
  jobCount: number;
  activeView: AppView;
  dataMode: "loading" | "live" | "demo" | "error";
  onNavigate: (view: AppView) => void;
  onConnect: () => void;
  onOpenOnboarding: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "discover" as const, label: "Discover", icon: Bot },
    { id: "jobs" as const, label: "Escrow jobs", icon: BriefcaseBusiness, count: jobCount },
    { id: "copilot" as const, label: "AI Copilot", icon: BrainCircuit, accent: true },
  ];
  const meta = viewMeta[activeView];

  function navigate(view: AppView) {
    onNavigate(view);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="ambient-grid" />
      <div className="ambient-aurora" />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[.065] bg-[#050914]/95 px-3 py-4 backdrop-blur-2xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-12 items-center justify-between px-2">
          <button
            className="flex items-center gap-2.5"
            onClick={() => navigate("overview")}
            aria-label="AgentRail home"
          >
            <span className="relative">
              <img src="/agentrail-mark.svg" alt="" className="size-9 rounded-xl shadow-[0_0_24px_rgba(52,211,153,.16)]" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#050914] bg-emerald-400" />
            </span>
            <span className="text-left">
              <strong className="block text-sm tracking-[-0.025em] text-white">AgentRail</strong>
              <span className="block text-[9px] uppercase tracking-[.16em] text-slate-600">Trust OS for AI work</span>
            </span>
          </button>
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </Button>
        </div>

        <nav className="mt-7 grid gap-1" aria-label="Product navigation">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-700">Workspace</p>
          {nav.map(({ id, label, icon: Icon, count, accent }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={cn(
                  "relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition",
                  active ? "text-white" : "text-slate-500 hover:bg-white/[.035] hover:text-slate-200",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="active-navigation"
                    className="absolute inset-0 border border-emerald-400/10 bg-gradient-to-r from-emerald-400/[.11] to-transparent"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon
                  size={17}
                  className={cn("relative", active && "text-emerald-300", accent && !active && "text-violet-400")}
                />
                <span className="relative">{label}</span>
                {accent && (
                  <Badge variant="secondary" className="relative ml-auto px-1.5 py-0 text-[8px] text-violet-300">AI</Badge>
                )}
                {Boolean(count) && !accent && (
                  <span className="relative ml-auto rounded-md bg-white/[.06] px-1.5 py-0.5 text-[9px] text-slate-400">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <nav className="mt-6 grid gap-1" aria-label="Validation navigation">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-700">Launch</p>
          <button
            onClick={() => navigate("growth")}
            className={cn(
              "relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition",
              activeView === "growth"
                ? "bg-emerald-400/[.08] text-emerald-200"
                : "text-slate-500 hover:bg-white/[.035] hover:text-slate-200",
            )}
          >
            <TrendingUp size={17} />
            Growth Lab
            <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[8px] text-emerald-300">NEW</Badge>
          </button>
          <button
            onClick={() => navigate("validation")}
            className={cn(
              "relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition",
              activeView === "validation"
                ? "bg-violet-400/[.08] text-violet-200"
                : "text-slate-500 hover:bg-white/[.035] hover:text-slate-200",
            )}
          >
            <Users size={17} />
            Validation hub
            <span className="ml-auto size-1.5 rounded-full bg-amber-300" />
          </button>
          <button
            onClick={onOpenOnboarding}
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-white/[.035] hover:text-slate-200"
          >
            <CircleHelp size={17} />
            Product tour
          </button>
        </nav>

        <div className="mt-auto grid gap-3">
          <div className="rounded-xl border border-white/[.06] bg-gradient-to-br from-white/[.035] to-transparent p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] text-slate-500">
                <Activity size={12} className={dataMode === "live" ? "text-emerald-400" : "text-amber-300"} />
                Protocol status
              </span>
              <span className={cn("size-1.5 rounded-full", dataMode === "live" ? "bg-emerald-400" : "bg-amber-300")} />
            </div>
            <strong className="mt-2 block text-xs text-slate-300">
              {dataMode === "live" ? "Testnet operational" : dataMode === "loading" ? "Connecting…" : "Attention required"}
            </strong>
          </div>
          <a
            href="https://stellar.expert/explorer/testnet/contract/CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 text-[10px] text-slate-600 transition hover:text-slate-300"
          >
            <ShieldCheck size={13} />
            Verified contract
            <ExternalLink size={10} className="ml-auto" />
          </a>
        </div>
      </aside>

      {mobileOpen && (
        <button className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
      )}

      <div className="relative pb-20 lg:pb-0 lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center border-b border-white/[.055] bg-[#050914]/78 px-4 backdrop-blur-2xl sm:px-6">
          <Button className="mr-2 lg:hidden" variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white">{meta.title}</h1>
              <Badge className="hidden sm:inline-flex">
                <Radio size={9} className="animate-pulse" />
                Testnet
              </Badge>
            </div>
            <p className="hidden text-[10px] text-slate-600 sm:block">{meta.subtitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-violet-300 sm:inline-flex"
              onClick={() => navigate("copilot")}
            >
              <Sparkles size={14} />
              Create with AI
            </Button>
            <Button
              variant={wallet ? "outline" : "default"}
              onClick={onConnect}
              disabled={connecting}
              className="max-w-[190px]"
            >
              {connecting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : wallet ? (
                <span className="relative flex size-5 items-center justify-center rounded-full bg-emerald-400/10">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                </span>
              ) : (
                <Wallet size={15} />
              )}
              <span className="truncate">{wallet ? shortAddress(wallet.address) : "Connect wallet"}</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1660px] p-4 sm:p-6 lg:p-7">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-2xl border border-white/[.08] bg-[#080d19]/92 p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden">
        {[
          { id: "overview" as const, label: "Home", icon: LayoutDashboard },
          { id: "discover" as const, label: "Agents", icon: Bot },
          { id: "jobs" as const, label: "Jobs", icon: BriefcaseBusiness },
          { id: "copilot" as const, label: "Copilot", icon: BrainCircuit },
          { id: "growth" as const, label: "Grow", icon: TrendingUp },
          { id: "validation" as const, label: "Proof", icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[8px] transition",
              activeView === id ? "bg-emerald-400/10 text-emerald-300" : "text-slate-600",
            )}
          >
            <Icon size={15} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

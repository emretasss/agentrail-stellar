import {
  Activity,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Radio,
  Settings2,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import type { WalletState } from "@/lib/stellar";

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Marketplace", icon: Bot },
  { label: "My jobs", icon: BriefcaseBusiness, count: 3 },
  { label: "Analytics", icon: BarChart3 },
];

export function shortAddress(value: string, size = 5) {
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}

export function AppShell({
  children,
  wallet,
  connecting,
  onConnect,
  onOpenOnboarding,
}: {
  children: React.ReactNode;
  wallet: WalletState | null;
  connecting: boolean;
  onConnect: () => void;
  onOpenOnboarding: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="ambient-grid" />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/[.07] bg-slate-950/95 px-3 py-4 backdrop-blur-xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-11 items-center justify-between px-2">
          <a className="flex items-center gap-2.5" href="#" aria-label="AgentRail home">
            <img src="/agentrail-mark.svg" alt="" className="size-8 rounded-lg" />
            <span className="font-semibold tracking-[-0.02em] text-slate-100">
              AgentRail
            </span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
              BETA
            </Badge>
          </a>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="mt-7 grid gap-1" aria-label="Primary navigation">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">
            Workspace
          </p>
          {nav.map(({ label, icon: Icon, active, count }) => (
            <button
              key={label}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-emerald-400/[.09] text-emerald-300"
                  : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200",
              )}
            >
              <Icon size={17} />
              <span>{label}</span>
              {count && (
                <span className="ml-auto rounded bg-white/[.06] px-1.5 py-0.5 text-[10px] text-slate-400">
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <nav className="mt-6 grid gap-1" aria-label="Secondary navigation">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">
            Manage
          </p>
          <button className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-white/[.04] hover:text-slate-200">
            <Activity size={17} />
            Activity
          </button>
          <button className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-white/[.04] hover:text-slate-200">
            <Settings2 size={17} />
            Settings
          </button>
        </nav>

        <div className="mt-auto grid gap-3">
          <button
            onClick={onOpenOnboarding}
            className="group rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-left transition hover:border-emerald-400/20 hover:bg-emerald-400/[.035]"
          >
            <div className="mb-3 flex items-center justify-between">
              <CircleHelp size={16} className="text-emerald-400" />
              <ChevronRight
                size={14}
                className="text-slate-600 transition group-hover:translate-x-0.5"
              />
            </div>
            <strong className="block text-xs text-slate-200">New to AgentRail?</strong>
            <span className="mt-1 block text-[11px] leading-5 text-slate-500">
              Finish the 3-minute Testnet walkthrough.
            </span>
          </button>
          <a
            href="https://stellar.expert/explorer/testnet/contract/CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 text-xs text-slate-600 transition hover:text-slate-300"
          >
            <ShieldCheck size={14} />
            Verified contract
            <ExternalLink size={11} className="ml-auto" />
          </a>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="relative lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-white/[.06] bg-slate-950/75 px-4 backdrop-blur-xl sm:px-6">
          <Button
            className="mr-2 lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-slate-100">
                Command center
              </h1>
              <Badge className="hidden sm:inline-flex">
                <Radio size={10} className="animate-pulse" />
                Testnet live
              </Badge>
            </div>
            <p className="hidden text-[11px] text-slate-600 sm:block">
              Escrow, delivery and reputation in one workspace
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
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
                <Wallet size={16} />
              )}
              <span className="truncate">
                {wallet ? shortAddress(wallet.address) : "Connect wallet"}
              </span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

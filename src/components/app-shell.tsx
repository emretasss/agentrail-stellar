import {
  Activity,
  CircleHelp,
  ExternalLink,
  Menu,
  Search,
  Radio,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";
import type { WalletState } from "@/lib/stellar";
import {
  getWorkspaceGroup,
  getWorkspaceNavItem,
  workspaceMobileNavigation,
  type AppView,
} from "@/config/workspace-navigation";
import { CommandPalette } from "@/components/command-palette";

export type { AppView } from "@/config/workspace-navigation";

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
  const [commandOpen, setCommandOpen] = useState(false);
  const nav = getWorkspaceGroup("workspace");
  const launchNav = getWorkspaceGroup("launch");
  const meta = getWorkspaceNavItem(activeView);

  useEffect(() => {
    const open = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", open);
    return () => window.removeEventListener("keydown", open);
  }, []);

  function navigate(view: AppView) {
    onNavigate(view);
    setMobileOpen(false);
  }

  return (
    <div className="workspace-shell min-h-screen bg-background text-foreground">
      <div className="ambient-grid" />
      <div className="ambient-aurora" />
      <div className="ledger-stars" />
      <aside
        className={cn(
          "workspace-sidebar fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[.07] px-3 py-4 backdrop-blur-2xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-12 items-center justify-between px-2">
          <button
            className="flex items-center gap-2.5"
            onClick={() => navigate("overview")}
            aria-label="AgentRail home"
          >
            <span className="workspace-brand-mark relative grid size-10 place-items-center rounded-xl">
              <img src="/agentrail-mark.svg" alt="" className="size-8 rounded-lg" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#080916] bg-[#61f6c2] shadow-[0_0_10px_#61f6c2]" />
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
          {nav.map(({ id, shortLabel: label, icon: Icon, badge }) => {
            const active = activeView === id;
            const count = id === "jobs" ? jobCount : 0;
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
                    className="absolute inset-0 border border-[#746cff]/20 bg-gradient-to-r from-[#746cff]/[.16] via-[#746cff]/[.07] to-transparent shadow-[inset_3px_0_0_#78e8ff]"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon
                  size={17}
                  className={cn("relative", active && "text-[#8fe9ff]", badge === "AI" && !active && "text-[#aaa5ff]")}
                />
                <span className="relative">{label}</span>
                {badge && (
                  <Badge variant="secondary" className="relative ml-auto px-1.5 py-0 text-[8px] text-violet-300">{badge}</Badge>
                )}
                {Boolean(count) && !badge && (
                  <span className="relative ml-auto rounded-md bg-white/[.06] px-1.5 py-0.5 text-[9px] text-slate-400">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <nav className="mt-6 grid gap-1" aria-label="Validation navigation">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-700">Launch</p>
          {launchNav.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={cn(
                "relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition",
                activeView === id
                  ? "bg-[#61f6c2]/[.08] text-[#83f8cf]"
                  : "text-slate-500 hover:bg-white/[.035] hover:text-slate-200",
              )}
            >
              <Icon size={17} />
              {label}
              {badge ? <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[8px] text-emerald-300">{badge}</Badge> : <span className="ml-auto size-1.5 rounded-full bg-amber-300" />}
            </button>
          ))}
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
            {dataMode === "loading" ? (
              <LoadingState label="Syncing Testnet" variant="Orbit" className="mt-2" />
            ) : (
              <strong className="mt-2 block text-xs text-slate-300">
                {dataMode === "live" ? "Testnet operational" : "Attention required"}
              </strong>
            )}
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
        <header className="workspace-header sticky top-0 z-20 flex h-[72px] items-center border-b border-white/[.06] px-4 backdrop-blur-2xl sm:px-6">
          <Button className="mr-2 lg:hidden" variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white">{meta.label}</h1>
              <Badge className="hidden sm:inline-flex">
                <Radio size={9} className="animate-pulse" />
                Testnet
              </Badge>
            </div>
            <p className="hidden text-[10px] text-slate-600 sm:block">{meta.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden text-slate-500 md:inline-flex" onClick={() => setCommandOpen(true)}>
              <Search size={14} /> Search <span className="rounded border border-white/[.08] px-1.5 py-0.5 text-[8px]">⌘K</span>
            </Button>
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

      <nav className="workspace-mobile-nav fixed inset-x-3 bottom-3 z-30 flex gap-1 overflow-x-auto rounded-2xl border border-white/[.09] p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden" aria-label="Mobile workspace navigation">
        {workspaceMobileNavigation.map(({ id, shortLabel: label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            aria-current={activeView === id ? "page" : undefined}
            className={cn(
              "flex min-w-[58px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[8px] transition",
              activeView === id ? "bg-[#746cff]/15 text-[#8fe9ff] shadow-[inset_0_0_0_1px_rgba(120,232,255,.1)]" : "text-slate-600",
            )}
          >
            <Icon size={15} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={navigate} onTour={onOpenOnboarding} />
    </div>
  );
}

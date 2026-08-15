import {
  ArrowRight,
  Bot,
  Braces,
  Check,
  ChevronRight,
  CircleDollarSign,
  Code2,
  Fingerprint,
  Gauge,
  Hexagon,
  LockKeyhole,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/ui/loading-state";
import { shortAddress } from "@/components/app-shell";
import type { WalletState } from "@/lib/stellar";

type LandingPageProps = {
  wallet: WalletState | null;
  connecting: boolean;
  onEnter: () => void;
  onOpenCopilot: () => void;
  onConnect: () => Promise<boolean>;
};

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const flow = [
  {
    number: "01",
    icon: Sparkles,
    eyebrow: "INTENT LAYER",
    title: "Shape the mission",
    copy: "Turn a rough prompt into a precise, hash-committed brief with measurable acceptance criteria.",
    accent: "violet",
  },
  {
    number: "02",
    icon: LockKeyhole,
    eyebrow: "ESCROW LAYER",
    title: "Lock funds, not trust",
    copy: "XLM remains in a non-custodial Soroban contract while the agent completes the agreed scope.",
    accent: "cyan",
  },
  {
    number: "03",
    icon: ShieldCheck,
    eyebrow: "SETTLEMENT LAYER",
    title: "Verify, then release",
    copy: "Approve delivery evidence, settle atomically, and create portable on-chain reputation.",
    accent: "mint",
  },
];

const trustSignals = [
  [Braces, "Soroban-native", "Auditable escrow logic"],
  [ShieldCheck, "Buyer-controlled", "Release stays in your hands"],
  [Fingerprint, "Proof-linked", "Private briefs, public integrity"],
  [Zap, "AI-scoped", "Clear outcomes before funding"],
] as const;

export function LandingPage({
  wallet,
  connecting,
  onEnter,
  onOpenCopilot,
  onConnect,
}: LandingPageProps) {
  const reduceMotion = useReducedMotion();

  async function connectAndEnter() {
    if (wallet || (await onConnect())) onEnter();
  }

  return (
    <div className="landing-page relative isolate min-h-screen overflow-hidden bg-[#050510] text-white">
      <div className="landing-noise" />
      <div className="landing-mesh" />
      <div className="landing-beam landing-beam-one" />
      <div className="landing-beam landing-beam-two" />

      <header className="landing-header relative z-30 mx-auto mt-3 flex h-[68px] w-[calc(100%-24px)] max-w-[1376px] items-center rounded-2xl px-4 sm:mt-5 sm:w-[calc(100%-40px)] sm:px-5">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex items-center gap-3"
          aria-label="Back to top"
        >
          <span className="brand-mark relative grid size-10 place-items-center rounded-xl">
            <img src="/agentrail-mark.svg" alt="" className="size-8 rounded-lg" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#0b0b18] bg-[#61f6c2] shadow-[0_0_12px_#61f6c2]" />
          </span>
          <span className="text-left">
            <strong className="block text-[15px] font-semibold tracking-[-0.03em]">AgentRail</strong>
            <span className="block text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">Autonomous work protocol</span>
          </span>
        </button>

        <nav className="mx-auto hidden items-center gap-1 rounded-full border border-white/[.06] bg-black/20 p-1 text-xs text-slate-400 md:flex" aria-label="Landing navigation">
          {[["#how-it-works", "How it works"], ["#protocol", "Protocol"], ["#security", "Security"]].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 transition hover:bg-white/[.06] hover:text-white">{label}</a>
          ))}
        </nav>

        <Button variant="outline" onClick={onEnter} className="ml-auto h-10 rounded-full border-white/10 bg-white/[.04] px-4 text-xs backdrop-blur-xl sm:px-5">
          <span className="hidden sm:inline">Enter app</span><ArrowRight size={14} />
        </Button>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-[1440px] items-center gap-16 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:pb-28 lg:pt-20">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: reduceMotion ? 0 : 0.09 }}>
            <motion.div variants={reveal} transition={{ duration: 0.55 }}>
              <Badge className="landing-live-badge border-[#655cff]/30 bg-[#655cff]/10 px-3 py-1.5 text-[#bcb8ff]">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#61f6c2] opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-[#61f6c2]" /></span>
                Stellar Testnet · Protocol online
              </Badge>
            </motion.div>

            <motion.h1 variants={reveal} transition={{ duration: 0.65 }} className="mt-7 max-w-[780px] text-[3.25rem] font-semibold leading-[.94] tracking-[-0.068em] text-balance sm:text-[4.5rem] lg:text-[5.15rem]">
              Trust rails for the
              <span className="landing-gradient-text block">agent economy.</span>
            </motion.h1>

            <motion.p variants={reveal} transition={{ duration: 0.65 }} className="mt-7 max-w-xl text-base leading-7 text-[#a7aec2] sm:text-lg sm:leading-8">
              Hire verifiable AI agents and settle work through programmable Stellar escrow. Private by design. Publicly provable.
            </motion.p>

            <motion.div variants={reveal} transition={{ duration: 0.65 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => void connectAndEnter()} disabled={connecting} className="landing-primary-button h-13 rounded-full px-7 text-sm">
                {connecting ? <LoadingState label="Connecting" variant="Dots" className="text-white [&_span]:text-white" /> : wallet ? <><Zap size={16} /> Open command center</> : <><Wallet size={16} /> Connect wallet</>}
              </Button>
              <Button size="lg" variant="outline" onClick={onOpenCopilot} className="h-13 rounded-full border-white/10 bg-white/[.035] px-7 text-sm backdrop-blur-xl hover:border-[#8d86ff]/30">
                <Sparkles size={16} className="text-[#a8a3ff]" /> Build a mission
              </Button>
            </motion.div>

            <motion.div variants={reveal} transition={{ duration: 0.65 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[.1em] text-slate-500">
              {["Non-custodial", "On-chain proof", "Buyer controlled"].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check size={13} className="text-[#61f6c2]" />{item}</span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }} className="relative mx-auto w-full max-w-[610px]">
            <div className="network-orbit network-orbit-one" />
            <div className="network-orbit network-orbit-two" />
            <div className="absolute -left-8 top-14 hidden items-center gap-2 rounded-full border border-white/10 bg-[#0b0c1b]/80 px-3 py-2 text-[10px] font-semibold text-slate-300 shadow-2xl backdrop-blur-xl sm:flex">
              <Radio size={11} className="text-[#61f6c2]" /> LEDGER 927,418
            </div>
            <div className="absolute -right-5 bottom-20 z-20 hidden items-center gap-2 rounded-full border border-[#8d86ff]/20 bg-[#0b0c1b]/85 px-3 py-2 text-[10px] font-semibold text-[#c9c6ff] shadow-2xl backdrop-blur-xl sm:flex">
              <ShieldCheck size={12} /> ESCROW VERIFIED
            </div>

            <div className="landing-terminal relative overflow-hidden rounded-[30px] border border-white/[.1] bg-[#0b0c1a]/80 p-4 shadow-[0_40px_130px_rgba(0,0,0,.6),0_0_80px_rgba(85,77,255,.08)] backdrop-blur-2xl sm:p-5">
              <div className="terminal-scanline" />
              <div className="relative flex items-center justify-between border-b border-white/[.07] pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl border border-[#746cff]/20 bg-[#746cff]/10 text-[#a8a3ff]"><Network size={18} /></span>
                  <div><strong className="block text-sm">Execution rail</strong><span className="text-[11px] text-slate-500">MISSION / AR-0042</span></div>
                </div>
                <Badge variant="secondary" className="border-[#61f6c2]/15 bg-[#61f6c2]/[.07] text-[#83f8cf]"><span className="size-1.5 rounded-full bg-[#61f6c2] shadow-[0_0_8px_#61f6c2]" /> Live</Badge>
              </div>

              <div className="relative my-5 overflow-hidden rounded-2xl border border-white/[.07] bg-[#070812]/70 p-5">
                <div className="absolute right-0 top-0 size-36 bg-[#6c63ff]/[.07] blur-3xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Active mission</span><h2 className="mt-1.5 text-lg font-semibold tracking-[-.025em]">Audit payment API reliability</h2></div>
                  <span className="rounded-full border border-white/[.07] bg-white/[.03] px-2.5 py-1 font-mono text-[10px] text-[#8fe9ff]">12.50 XLM</span>
                </div>

                <div className="relative mt-6 grid grid-cols-[auto_1fr] gap-x-4">
                  {[
                    [Fingerprint, "Scope committed", "0x7DA…91F", "complete"],
                    [LockKeyhole, "Escrow funded", "Ledger final", "complete"],
                    [Bot, "Agent executing", "Proof streaming", "active"],
                    [CircleDollarSign, "Buyer release", "Awaiting review", "pending"],
                  ].map(([Icon, title, detail, state], index) => {
                    const FlowIcon = Icon as typeof Fingerprint;
                    return (
                      <div className="contents" key={String(title)}>
                        <div className="relative flex flex-col items-center">
                          <span className={`relative z-10 grid size-9 place-items-center rounded-xl border ${state === "complete" ? "border-[#61f6c2]/20 bg-[#61f6c2]/10 text-[#61f6c2]" : state === "active" ? "border-[#746cff]/30 bg-[#746cff]/15 text-[#aaa5ff] shadow-[0_0_24px_rgba(116,108,255,.15)]" : "border-white/[.07] bg-white/[.025] text-slate-600"}`}><FlowIcon size={15} /></span>
                          {index < 3 && <span className={`h-9 w-px ${index < 2 ? "bg-[#61f6c2]/25" : "bg-gradient-to-b from-[#746cff]/30 to-white/[.05]"}`} />}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-center justify-between gap-3"><strong className="text-xs text-slate-200 sm:text-sm">{String(title)}</strong><span className="font-mono text-[10px] text-slate-500 sm:text-[11px]">{String(detail)}</span></div>
                          {state === "active" && <LoadingState label="Validating evidence" variant="Drive" className="mt-2" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative grid grid-cols-3 gap-2.5">
                {[["$0", "Custody risk"], ["~5s", "Finality"], ["100%", "Buyer control"]].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/[.06] bg-white/[.025] p-3.5"><strong className="block text-base text-white">{value}</strong><span className="mt-1 block text-[10px] uppercase tracking-[.08em] text-slate-600">{label}</span></div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section id="protocol" className="relative border-y border-white/[.06] bg-white/[.015]">
          <div className="protocol-line" />
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
            {trustSignals.map(([Icon, title, detail]) => (
              <div key={title} className="group flex min-h-28 items-center gap-3 border-white/[.06] px-3 py-6 odd:border-r lg:border-r lg:last:border-r-0 lg:px-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-[#8fe9ff] transition group-hover:border-[#746cff]/25 group-hover:bg-[#746cff]/10 group-hover:text-[#b5b1ff]"><Icon size={17} /></span>
                <span><strong className="block text-xs font-semibold text-slate-200 sm:text-sm">{title}</strong><span className="mt-1 hidden text-[11px] text-slate-600 sm:block">{detail}</span></span>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="relative mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="landing-section-glow left-[-18rem] top-24 bg-[#574cff]" />
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="section-kicker"><Hexagon size={12} /> PROTOCOL FLOW</span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">One rail. Three trust layers.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#8e96aa]">Every step removes ambiguity while keeping funds and final approval in the buyer’s control.</p>
          </motion.div>

          <div className="relative mt-14 grid gap-4 lg:grid-cols-3">
            <div className="flow-connector hidden lg:block" />
            {flow.map(({ number, icon: Icon, eyebrow, title, copy, accent }, index) => (
              <motion.article key={number} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: reduceMotion ? 0 : index * 0.1 }} className={`flow-card flow-card-${accent} group relative overflow-hidden rounded-[28px] border border-white/[.08] bg-[#0a0b18]/75 p-7 backdrop-blur-xl sm:p-8`}>
                <div className="flow-card-glow" />
                <div className="relative flex items-center justify-between">
                  <span className="flow-icon grid size-12 place-items-center rounded-2xl border"><Icon size={20} /></span>
                  <span className="font-mono text-xs tracking-[.16em] text-slate-700">/ {number}</span>
                </div>
                <span className="relative mt-12 block text-[9px] font-bold tracking-[.2em] text-slate-600">{eyebrow}</span>
                <h3 className="relative mt-3 text-xl font-semibold tracking-[-.025em]">{title}</h3>
                <p className="relative mt-3 text-sm leading-6 text-[#8e96aa]">{copy}</p>
                <span className="relative mt-8 flex items-center gap-1 text-xs font-semibold text-slate-400 transition group-hover:text-white">Explore layer <ChevronRight size={13} className="transition group-hover:translate-x-1" /></span>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="security" className="relative mx-auto w-full max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-12 lg:pb-36">
          <div className="security-grid relative overflow-hidden rounded-[34px] border border-white/[.08] bg-[#090a18] p-6 sm:p-10 lg:p-14">
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#6158ff]/10 blur-[90px]" />
            <div className="relative grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <div>
                <span className="section-kicker"><ShieldCheck size={12} /> VERIFIABLE BY DESIGN</span>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">Privacy off-chain.<br /><span className="text-slate-500">Proof on-chain.</span></h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#8e96aa] sm:text-base">Your sensitive mission brief never needs to touch the ledger. AgentRail commits its fingerprint, escrows the value, and preserves a permanent settlement trail.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={onEnter} className="landing-primary-button h-13 rounded-full px-7">Launch AgentRail <ArrowRight size={15} /></Button>
                  <Button size="lg" variant="outline" onClick={onOpenCopilot} className="h-13 rounded-full border-white/10 bg-white/[.03] px-7">Try Mission Copilot</Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [Code2, "Hash commitment", "SHA-256 scope proof protects integrity without exposing the brief."],
                  [LockKeyhole, "Atomic escrow", "Funds move only through explicit Soroban contract state transitions."],
                  [Gauge, "Fast finality", "Stellar settlement gives agents and buyers a shared source of truth."],
                  [Fingerprint, "Portable reputation", "Completion history belongs to the agent, not the platform."],
                ].map(([Icon, title, copy]) => {
                  const FeatureIcon = Icon as typeof Code2;
                  return (
                    <div key={String(title)} className="security-tile rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
                      <FeatureIcon size={18} className="text-[#8fe9ff]" />
                      <strong className="mt-5 block text-sm">{String(title)}</strong>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{String(copy)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1344px] flex-col gap-4 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2"><img src="/agentrail-mark.svg" alt="" className="size-5 rounded-md opacity-70" />AgentRail · Autonomous work, settled on Stellar</span>
          <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#61f6c2]" />{wallet ? `Connected · ${shortAddress(wallet.address)}` : "Stellar Testnet · v0.4"}</span>
        </div>
      </footer>
    </div>
  );
}

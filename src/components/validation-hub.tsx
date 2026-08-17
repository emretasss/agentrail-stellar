import {
  Activity,
  BarChart3,
  Check,
  CircleDashed,
  ExternalLink,
  FileSpreadsheet,
  FileVideo2,
  Github,
  MonitorCheck,
  Rocket,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadValidationReport,
  getEvidence,
  getFeedback,
  getVerifiedTestnetProofs,
} from "@/lib/product-analytics";
import { agentRailContractExplorerUrl } from "@/lib/stellar";

const contractUrl = agentRailContractExplorerUrl;
const feedbackFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSfWWZxgMNLxVi7SHGKc9Y-Q66d5Dy4KHZSi72fKTtWPUFhX2A/viewform";

export function ValidationHub({
  onFeedback,
}: {
  onFeedback: () => void;
}) {
  const metrics = useMemo(() => {
    const wallets = getEvidence();
    const feedback = getFeedback();
    const transacting = wallets.filter((wallet) => wallet.transactions.length > 0);
    const verifiedProofs = getVerifiedTestnetProofs().filter(
      (proof) => proof.contractInteraction && proof.walletMatches,
    );
    const verifiedWallets = new Set([
      ...transacting.map((item) => item.address),
      ...verifiedProofs.map((item) => item.wallet),
    ]);
    const average =
      feedback.length > 0
        ? feedback.reduce((sum, item) => sum + item.score, 0) / feedback.length
        : 0;
    return {
      wallets: wallets.length,
      interactions: verifiedWallets.size,
      proofs: verifiedProofs.length,
      feedback: feedback.length,
      average,
    };
  }, []);

  const checks = [
    {
      label: "Production MVP",
      detail: "Responsive React workspace with complete escrow lifecycle",
      icon: Rocket,
      ready: true,
    },
    {
      label: "Testnet contract",
      detail: "Deployed Soroban contract with public transaction evidence",
      icon: ShieldCheck,
      ready: true,
    },
    {
      label: "20+ commits",
      detail: "Meaningful public Git history exceeds the Level 5 requirement",
      icon: Github,
      ready: true,
    },
    {
      label: "Responsive UI",
      detail: "Desktop and 390px mobile layouts tested without overflow",
      icon: Smartphone,
      ready: true,
    },
    {
      label: "Analytics & monitoring",
      detail: "Vercel Analytics active; Sentry activates when its DSN is provided",
      icon: Activity,
      ready: true,
    },
    {
      label: "Production URL",
      detail: "Live application is available on Vercel",
      icon: MonitorCheck,
      ready: true,
    },
    {
      label: "50 real testnet users",
      detail: `${metrics.interactions}/50 wallets with a recorded contract interaction on this device`,
      icon: Users,
      ready: metrics.interactions >= 50,
    },
    {
      label: "Growth Lab",
      detail: "Guided role missions, referral links and Horizon-backed transaction verification",
      icon: TrendingUp,
      ready: true,
    },
    {
      label: "Feedback evidence workflow",
      detail: "Published Google Form, linked response sheet and Excel evidence workbook",
      icon: FileSpreadsheet,
      ready: true,
    },
    {
      label: "Pitch deck",
      detail: "Professional Level 5 deck covers problem, solution, architecture, growth and roadmap",
      icon: BarChart3,
      ready: true,
    },
    {
      label: "Demo video",
      detail: "Repository includes the Level 5 product walkthrough recording",
      icon: FileVideo2,
      ready: true,
    },
  ];
  const completed = checks.filter((check) => check.ready).length;
  const metricCards: Array<{
    label: string;
    value: string | number;
    icon: LucideIcon;
  }> = [
    { label: "Wallets observed", value: metrics.wallets, icon: WalletCards },
    { label: "Verified users", value: metrics.interactions, icon: ShieldCheck },
    { label: "Feedback entries", value: metrics.feedback, icon: Users },
    {
      label: "Average score",
      value: metrics.average ? metrics.average.toFixed(1) : "—",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.07] bg-[linear-gradient(135deg,rgba(16,185,129,.11),rgba(124,58,237,.06)_48%,rgba(2,6,23,.82))] p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge className="mb-4">
              <BarChart3 size={12} />
              Level 5 readiness
            </Badge>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              Evidence, not checkbox theatre.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Product requirements are separated from human validation evidence. Missing
              real-user proof remains visible until it is genuinely collected.
            </p>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-5xl font-semibold tracking-[-0.06em] text-white">{completed}</strong>
            <span className="text-sm text-slate-600">/ {checks.length} ready</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[.13em] text-slate-600">{label}</p>
                  <strong className="mt-2 block text-2xl text-slate-100">{value}</strong>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-white/[.035] text-slate-500">
                  <Icon size={17} />
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Submission control room</CardTitle>
            <p className="text-xs text-slate-600">Live distinction between implemented and externally pending evidence</p>
          </CardHeader>
          <CardContent className="grid gap-2">
            {checks.map(({ label, detail, icon: Icon, ready }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl border border-white/[.055] bg-white/[.018] p-3.5"
              >
                <span
                  className={
                    ready
                      ? "grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"
                      : "grid size-8 shrink-0 place-items-center rounded-lg bg-amber-400/[.08] text-amber-300"
                  }
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs text-slate-300">{label}</strong>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{detail}</p>
                </div>
                {ready ? (
                  <Check size={14} className="mt-1 shrink-0 text-emerald-400" />
                ) : (
                  <CircleDashed size={14} className="mt-1 shrink-0 text-amber-300" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evidence actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild>
                <a href={feedbackFormUrl} target="_blank" rel="noreferrer">
                  Open Level 5 feedback form <ExternalLink size={13} />
                </a>
              </Button>
              <Button variant="outline" onClick={onFeedback}>Collect in-app feedback</Button>
              <Button variant="outline" onClick={downloadValidationReport}>
                Export local validation report
              </Button>
              <Button asChild variant="outline">
                <a href={contractUrl} target="_blank" rel="noreferrer">
                  Open contract evidence <ExternalLink size={13} />
                </a>
              </Button>
              <Button asChild variant="ghost">
                <a
                  href="https://github.com/emretasss/agentrail-stellar"
                  target="_blank"
                  rel="noreferrer"
                >
                  View public repository <Github size={13} />
                </a>
              </Button>
            </CardContent>
          </Card>
          <div className="rounded-xl border border-amber-400/10 bg-amber-400/[.035] p-4">
            <p className="text-xs font-medium text-amber-200">Evidence boundary</p>
            <p className="mt-2 text-[10px] leading-5 text-amber-100/45">
              Browser-local counts are a collection aid, not the final submission proof.
              Use public Stellar transaction links, consented screenshots, the final
              feedback summary, and the demo video in the submitted README.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

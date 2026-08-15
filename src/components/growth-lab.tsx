import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  Fingerprint,
  Gift,
  Link2,
  LoaderCircle,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  getGrowthProfile,
  getVerifiedTestnetProofs,
  saveGrowthProfile,
  saveVerifiedTestnetProof,
  touchGrowthProfile,
  trackEvent,
} from "@/lib/product-analytics";
import {
  verifyAgentRailTestnetTransaction,
  type TestnetTransactionVerification,
  type WalletState,
} from "@/lib/stellar";
import { cn } from "@/lib/utils";
import type {
  GrowthMission,
  GrowthProfile,
  GrowthRole,
  VerifiedTestnetProof,
} from "@/types/agentrail";

const feedbackFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSfWWZxgMNLxVi7SHGKc9Y-Q66d5Dy4KHZSi72fKTtWPUFhX2A/viewform";

const roles: Array<{ id: GrowthRole; label: string; detail: string }> = [
  { id: "buyer", label: "Buyer", detail: "Scope and fund protected work" },
  { id: "agent", label: "Agent", detail: "Publish and deliver a service" },
  { id: "explorer", label: "Explorer", detail: "Audit the live protocol" },
];

const missions: Array<{
  id: GrowthMission;
  label: string;
  detail: string;
  view: "overview" | "discover" | "jobs" | "copilot";
}> = [
  {
    id: "register_agent",
    label: "Publish an agent",
    detail: "Create a contract-owned service identity.",
    view: "overview",
  },
  {
    id: "create_job",
    label: "Fund an escrow job",
    detail: "Hire a verified agent and protect XLM.",
    view: "discover",
  },
  {
    id: "deliver_job",
    label: "Submit delivery proof",
    detail: "Record a private deliverable's SHA-256 proof.",
    view: "jobs",
  },
  {
    id: "approve_job",
    label: "Release and rate",
    detail: "Settle payment and update reputation.",
    view: "jobs",
  },
  {
    id: "explore_contract",
    label: "Audit a real transaction",
    detail: "Inspect successful AgentRail contract activity.",
    view: "overview",
  },
];

function shortHash(value: string) {
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

function createReferralCode(wallet?: string) {
  if (wallet) return `AR-${wallet.slice(1, 7).toUpperCase()}`;
  return `AR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export function GrowthLab({
  wallet,
  connecting,
  onConnect,
  onNavigate,
}: {
  wallet: WalletState | null;
  connecting: boolean;
  onConnect: () => void;
  onNavigate: (view: "overview" | "discover" | "jobs" | "copilot") => void;
}) {
  const initialProfile = useMemo(() => getGrowthProfile(), []);
  const [role, setRole] = useState<GrowthRole>(initialProfile?.role ?? "buyer");
  const [mission, setMission] = useState<GrowthMission>(
    initialProfile?.mission ?? "create_job",
  );
  const [profile, setProfile] = useState<GrowthProfile | null>(initialProfile);
  const [walletInput, setWalletInput] = useState(wallet?.address ?? "");
  const [hash, setHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] =
    useState<TestnetTransactionVerification | null>(null);
  const [proofs, setProofs] = useState<VerifiedTestnetProof[]>(() =>
    getVerifiedTestnetProofs(),
  );
  const [feedbackOpened, setFeedbackOpened] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    if (wallet?.address) setWalletInput(wallet.address);
  }, [wallet?.address]);

  useEffect(() => {
    if (touched.current) return;
    touched.current = true;
    const next = touchGrowthProfile();
    if (next) setProfile(next);

    const referredBy = new URLSearchParams(window.location.search).get("ref");
    if (referredBy) trackEvent("growth_referral_arrived", { referredBy });
  }, []);

  const validWallet = /^G[A-Z2-7]{55}$/.test(walletInput.trim());
  const acceptedProofs = proofs.filter(
    (proof) => proof.contractInteraction && proof.walletMatches,
  );
  const progress =
    (profile ? 25 : 0) +
    (validWallet ? 25 : 0) +
    (acceptedProofs.length > 0 ? 35 : 0) +
    (feedbackOpened ? 15 : 0);
  const referralCode = profile?.referralCode ?? createReferralCode(wallet?.address);
  const inviteUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(referralCode)}#growth`;
  const selectedMission = missions.find((item) => item.id === mission)!;

  function persistMission(nextRole = role, nextMission = mission) {
    const current = getGrowthProfile();
    const now = new Date().toISOString();
    const referredBy =
      current?.referredBy ??
      new URLSearchParams(window.location.search).get("ref") ??
      undefined;
    const next: GrowthProfile = {
      role: nextRole,
      mission: nextMission,
      referralCode: current?.referralCode ?? createReferralCode(wallet?.address),
      referredBy,
      startedAt: current?.startedAt ?? now,
      lastSeenAt: now,
      visits: current?.visits ?? 1,
    };
    saveGrowthProfile(next);
    setProfile(next);
  }

  function chooseRole(nextRole: GrowthRole) {
    setRole(nextRole);
    persistMission(nextRole, mission);
  }

  function chooseMission(nextMission: GrowthMission) {
    setMission(nextMission);
    persistMission(role, nextMission);
  }

  function startMission() {
    persistMission();
    trackEvent("growth_mission_started", { mission, role });
    if (mission === "explore_contract") {
      window.open(
        "https://stellar.expert/explorer/testnet/contract/CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5",
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    onNavigate(selectedMission.view);
    toast.info(`${selectedMission.label} mission started`, {
      description: "Return to Growth Lab with the successful transaction hash.",
    });
  }

  async function verifyProof(event: React.FormEvent) {
    event.preventDefault();
    setVerifying(true);
    setVerification(null);
    try {
      const result = await verifyAgentRailTestnetTransaction(
        hash,
        walletInput.trim() || undefined,
      );
      setVerification(result);
      if (!result.contractInteraction) {
        toast.error("Valid Testnet transaction, but not AgentRail", {
          description: "Submit a transaction that invokes the deployed AgentRail contract.",
        });
        return;
      }
      if (!result.walletMatches) {
        toast.error("Wallet does not match transaction", {
          description: "Use the participant wallet that sourced the contract operation.",
        });
        return;
      }

      const proof: VerifiedTestnetProof = {
        ...result,
        wallet: walletInput.trim() || result.sourceAccount,
        verifiedAt: new Date().toISOString(),
        role,
        mission,
      };
      const saved = saveVerifiedTestnetProof(proof);
      setProofs(getVerifiedTestnetProofs());
      toast.success(saved ? "AgentRail proof verified" : "Proof was already recorded", {
        description: `Ledger ${result.ledger}${result.functionName ? ` · ${result.functionName}` : ""}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Proof verification failed.";
      toast.error("Could not verify transaction", { description: message });
    } finally {
      setVerifying(false);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      trackEvent("growth_invite_copied", { role, mission });
      toast.success("Invite link copied");
    } catch {
      toast.error("Copy failed", { description: inviteUrl });
    }
  }

  function openFeedback() {
    setFeedbackOpened(true);
    trackEvent("growth_feedback_form_opened", { role, mission });
    window.open(feedbackFormUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.07] bg-[radial-gradient(circle_at_82%_18%,rgba(124,58,237,.22),transparent_34%),linear-gradient(135deg,rgba(16,185,129,.13),rgba(2,6,23,.9)_55%)] p-6 sm:p-8">
        <div className="relative grid gap-7 xl:grid-cols-[1fr_380px] xl:items-end">
          <div>
            <Badge className="mb-4 border-violet-400/20 bg-violet-400/10 text-violet-200">
              <Rocket size={12} />
              New for Level 5
            </Badge>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Turn onboarding into a verifiable Testnet quest.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Choose a real role, complete one AgentRail mission, verify the
              transaction directly against Horizon, then submit feedback. No
              screenshot-only claims and no fabricated wallets.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[.08] bg-slate-950/55 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Your quest progress</span>
              <strong className="text-white">{progress}%</strong>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[9px] text-slate-600">
              {[
                ["Mission", Boolean(profile)],
                ["Wallet", validWallet],
                ["Proof", acceptedProofs.length > 0],
                ["Feedback", feedbackOpened],
              ].map(([label, done]) => (
                <span key={String(label)} className={done ? "text-emerald-300" : ""}>
                  {done ? "✓ " : ""}{String(label)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target size={16} className="text-violet-300" />
              1. Choose your real use case
            </CardTitle>
            <CardDescription className="text-xs">
              The mission determines where the guided flow starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-3 gap-2">
              {roles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => chooseRole(item.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    role === item.id
                      ? "border-emerald-400/25 bg-emerald-400/[.08]"
                      : "border-white/[.06] bg-white/[.018] hover:bg-white/[.035]",
                  )}
                >
                  <strong className="block text-xs text-slate-200">{item.label}</strong>
                  <span className="mt-1 hidden text-[9px] leading-4 text-slate-600 sm:block">
                    {item.detail}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              {missions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => chooseMission(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                    mission === item.id
                      ? "border-violet-400/25 bg-violet-400/[.07]"
                      : "border-white/[.055] bg-white/[.015] hover:bg-white/[.03]",
                  )}
                >
                  <span className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg",
                    mission === item.id
                      ? "bg-violet-400/15 text-violet-200"
                      : "bg-white/[.04] text-slate-600",
                  )}>
                    {mission === item.id ? <Check size={14} /> : <CircleDashed size={13} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-xs text-slate-300">{item.label}</strong>
                    <span className="mt-0.5 block text-[10px] text-slate-600">{item.detail}</span>
                  </span>
                </button>
              ))}
            </div>
            <Button onClick={startMission}>
              Start {selectedMission.label.toLowerCase()} <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-400/10 bg-[linear-gradient(155deg,rgba(16,185,129,.055),rgba(8,13,25,.78)_42%)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Fingerprint size={16} className="text-emerald-300" />
              2. Verify real AgentRail activity
            </CardTitle>
            <CardDescription className="text-xs">
              Horizon confirms success, source wallet and contract invocation before the proof is counted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={verifyProof}>
              <label className="grid gap-1.5 text-[10px] font-medium uppercase tracking-[.12em] text-slate-600">
                Participant Testnet wallet
                <div className="relative">
                  <Wallet className="absolute left-3 top-3 text-slate-600" size={14} />
                  <Input
                    value={walletInput}
                    onChange={(event) => setWalletInput(event.target.value.trim())}
                    placeholder="G… public key"
                    className="pl-9 font-mono text-xs"
                  />
                </div>
              </label>
              <label className="grid gap-1.5 text-[10px] font-medium uppercase tracking-[.12em] text-slate-600">
                Successful transaction hash
                <Input
                  value={hash}
                  onChange={(event) => setHash(event.target.value.trim())}
                  placeholder="64-character Testnet hash"
                  className="font-mono text-xs"
                />
              </label>
              {!wallet && (
                <Button type="button" variant="outline" onClick={onConnect} disabled={connecting}>
                  {connecting ? <LoaderCircle size={14} className="animate-spin" /> : <Wallet size={14} />}
                  {connecting ? "Connecting…" : "Connect Freighter to fill wallet"}
                </Button>
              )}
              <Button type="submit" disabled={verifying || hash.length !== 64 || !validWallet}>
                {verifying ? <LoaderCircle size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                {verifying ? "Checking Horizon…" : "Verify Testnet proof"}
              </Button>
            </form>

            {verification && (
              <div className={cn(
                "mt-5 rounded-xl border p-4",
                verification.contractInteraction && verification.walletMatches
                  ? "border-emerald-400/15 bg-emerald-400/[.045]"
                  : "border-amber-400/15 bg-amber-400/[.04]",
              )}>
                <div className="flex items-start gap-3">
                  {verification.contractInteraction && verification.walletMatches ? (
                    <BadgeCheck className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                  ) : (
                    <ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={18} />
                  )}
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs text-slate-200">
                      {verification.contractInteraction && verification.walletMatches
                        ? "Verified AgentRail proof"
                        : "Successful transaction, proof not accepted"}
                    </strong>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      Ledger {verification.ledger} · {verification.functionName ?? "No AgentRail function detected"}
                    </p>
                  </div>
                  <a href={verification.explorerUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gift size={15} className="text-violet-300" />
              3. Invite the next tester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-5 text-slate-500">
              Share a referral-tagged Growth Lab link. Arrival and mission-start events are measured without attaching wallet addresses to analytics.
            </p>
            <div className="mt-4 rounded-lg border border-white/[.06] bg-slate-950/55 px-3 py-2 font-mono text-[10px] text-slate-500">
              {referralCode}
            </div>
            <Button className="mt-3 w-full" variant="outline" onClick={() => void copyInvite()}>
              <Copy size={13} /> Copy invite link
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles size={15} className="text-emerald-300" />
              4. Close the feedback loop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-5 text-slate-500">
              Submit name, email, public wallet, rating, transaction hash and product feedback through the published Level 5 form.
            </p>
            <Button className="mt-4 w-full" onClick={openFeedback}>
              Open participant form <ExternalLink size={13} />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users size={15} className="text-amber-300" />
              Local cohort evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <strong className="text-4xl tracking-[-0.06em] text-white">{acceptedProofs.length}</strong>
              <span className="pb-1 text-xs text-slate-600">/ 50 verified here</span>
            </div>
            <Progress value={(acceptedProofs.length / 50) * 100} className="mt-4" />
            <p className="mt-4 text-[10px] leading-4 text-slate-600">
              Device-local proof is a facilitation tool. The final cohort still requires the consented Google Sheet/Excel export and unique public records.
            </p>
          </CardContent>
        </Card>
      </section>

      {acceptedProofs.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Verified on this device</CardTitle>
              <CardDescription className="mt-1 text-xs">Deduplicated by transaction hash</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setProofs(getVerifiedTestnetProofs())}>
              <RefreshCw size={13} /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2">
            {acceptedProofs.slice().reverse().slice(0, 6).map((proof) => (
              <a
                key={proof.hash}
                href={proof.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/[.055] bg-white/[.018] p-3 transition hover:bg-white/[.035]"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                  <Link2 size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block font-mono text-[10px] text-slate-300">{shortHash(proof.hash)}</strong>
                  <span className="mt-1 block text-[9px] text-slate-600">
                    {proof.functionName ?? proof.mission} · ledger {proof.ledger} · {proof.role}
                  </span>
                </span>
                <ExternalLink size={13} className="text-slate-600" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

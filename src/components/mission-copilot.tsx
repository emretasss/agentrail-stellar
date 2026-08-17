import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Wallet,
} from "lucide-react";
import { signMessage } from "@stellar/freighter-api";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import LoadingState from "@/components/ui/loading-state";
import { missionPlaybooks } from "@/data/mission-playbooks";
import { assessMissionReadiness } from "@/lib/mission-readiness";
import { MissionQuality } from "@/components/mission-quality";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  checkFreighter,
  sha256Hex,
  stellarConfig,
  type WalletState,
} from "@/lib/stellar";

export type MissionPlan = {
  title: string;
  summary: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  risks: string[];
  recommendedBudgetXlm: number;
  deadlineLedgers: number;
};

class WalletAuthorizationError extends Error {}

function containsCredential(value: string) {
  return (
    /\bS[A-Z2-7]{55}\b/.test(value) ||
    /\bAIza[\w-]{30,}\b/.test(value) ||
    /\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{20,}\b/.test(value)
  );
}

function localDraft(goal: string): MissionPlan {
  const shortGoal = goal.trim().replace(/\s+/g, " ");
  return {
    title: "Structured agent mission",
    summary: shortGoal,
    deliverables: [
      "A complete result with source or artifact references",
      "A concise executive summary and reproducible evidence",
      "A limitations section covering unknowns and assumptions",
    ],
    acceptanceCriteria: [
      "Every material claim is linked to verifiable evidence",
      "The output directly answers the requested goal",
      "No private credentials or unsupported claims are included",
    ],
    risks: ["Scope may need refinement after the first agent response"],
    recommendedBudgetXlm: 0.05,
    deadlineLedgers: 2400,
  };
}

export function missionPlanToBrief(plan: MissionPlan) {
  return [
    plan.title,
    "",
    plan.summary,
    "",
    "Deliverables:",
    ...plan.deliverables.map((item) => `- ${item}`),
    "",
    "Acceptance criteria:",
    ...plan.acceptanceCriteria.map((item) => `- ${item}`),
    "",
    "Risks:",
    ...plan.risks.map((item) => `- ${item}`),
  ].join("\n");
}

export function MissionCopilot({
  onUsePlan,
  wallet,
  connecting,
  onConnect,
}: {
  onUsePlan: (plan: MissionPlan) => void;
  wallet: WalletState | null;
  connecting: boolean;
  onConnect: () => Promise<boolean>;
}) {
  const [goal, setGoal] = useLocalStorage<string>("agentrail.copilot-draft", "");
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"gemini" | "template" | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const goalInput = useRef<HTMLTextAreaElement | null>(null);
  const charCount = useMemo(() => goal.trim().length, [goal]);
  const readiness = useMemo(() => assessMissionReadiness(goal), [goal]);
  const walletVerified =
    wallet?.networkPassphrase === stellarConfig.networkPassphrase;

  useEffect(() => () => requestController.current?.abort(), []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      goalInput.current?.focus({ preventScroll: true });
      goalInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function stopGeneration() {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
    toast.info("Mission design stopped", {
      description: "No plan was applied. Your draft remains saved.",
    });
  }

  async function generate() {
    if (!walletVerified || !wallet) {
      toast.error("Connect a Stellar Testnet wallet first", {
        description: "Mission generation is locked until your wallet and network are verified.",
      });
      return;
    }
    const activeWallet = await checkFreighter();
    if (
      !activeWallet ||
      activeWallet.address !== wallet.address ||
      activeWallet.networkPassphrase !== stellarConfig.networkPassphrase
    ) {
      toast.error("Wallet session changed", {
        description: "Reconnect Freighter on Stellar Testnet before generating a mission.",
      });
      return;
    }
    if (charCount < 20) {
      toast.error("Add more mission detail", {
        description: "Describe the goal, output, and intended use in at least 20 characters.",
      });
      return;
    }
    if (containsCredential(goal)) {
      toast.error("Remove credentials from the mission", {
        description: "Private keys and API credentials must never be sent to Copilot.",
      });
      return;
    }
    const controller = new AbortController();
    requestController.current?.abort();
    requestController.current = controller;
    setLoading(true);
    try {
      const issuedAt = Date.now();
      const goalHash = await sha256Hex(goal.trim());
      const authorization = [
        "AgentRail Mission Copilot",
        `Wallet: ${wallet.address}`,
        `Goal SHA-256: ${goalHash}`,
        `Issued at: ${issuedAt}`,
      ].join("\n");
      const signed = await signMessage(authorization, {
        address: wallet.address,
        networkPassphrase: stellarConfig.networkPassphrase,
      });
      if (controller.signal.aborted) return;
      if (
        signed.error ||
        typeof signed.signedMessage !== "string" ||
        signed.signerAddress !== wallet.address
      ) {
        throw new WalletAuthorizationError(
          "Wallet authorization was rejected or signed by a different account.",
        );
      }
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          walletAddress: wallet.address,
          authorization,
          signature: signed.signedMessage,
          issuedAt,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as MissionPlan & { error?: string };
      if (!response.ok) {
        const message = payload.error ?? "Copilot request failed.";
        if ([502, 503, 504].includes(response.status)) throw new Error(message);
        toast.error("Mission was not generated", { description: message });
        return;
      }
      setPlan(payload);
      setSource("gemini");
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        return;
      }
      if (error instanceof WalletAuthorizationError) {
        toast.error("Wallet authorization required", { description: error.message });
        return;
      }
      setPlan(localDraft(goal));
      setSource("template");
      toast.info("AI endpoint is not configured", {
        description:
          error instanceof Error
            ? `${error.message} A safe local scope template was generated instead.`
            : "A safe local scope template was generated instead.",
      });
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
      <Card className="overflow-hidden">
        <div className="relative border-b border-white/[.06] p-6 sm:p-8">
          <div className="copilot-orb absolute -right-20 -top-24 size-64" />
          <Badge className="relative mb-5">
            <BrainCircuit size={12} />
            Mission Copilot
          </Badge>
          <h2 className="relative max-w-xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            Turn an idea into an escrow-ready mission.
          </h2>
          <p className="relative mt-3 max-w-xl text-sm leading-6 text-slate-400">
            AI converts an unstructured request into deliverables, acceptance criteria,
            risks, budget guidance, and a Stellar ledger deadline.
          </p>
        </div>
        <CardContent className="grid gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {missionPlaybooks.slice(0, 4).map((playbook) => (
              <button
                key={playbook.id}
                onClick={() => setGoal(playbook.prompt)}
                className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-left text-[10px] text-slate-500 transition hover:border-violet-400/25 hover:text-slate-300"
              >
                {playbook.title}
              </button>
            ))}
          </div>
          <div className="relative">
            <Textarea
              ref={goalInput}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={9}
              maxLength={2000}
              placeholder="Describe the business goal, expected output, constraints, and what a successful result looks like…"
              className="resize-none bg-slate-950/70 pb-10 text-sm leading-6"
            />
            <span className="absolute bottom-3 right-3 text-[10px] text-slate-700">
              Draft saved · {charCount}/2000
            </span>
          </div>
          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3.5">
            <div className="flex items-center justify-between text-[10px]"><span className="font-semibold text-slate-500">Mission readiness</span><strong className={readiness.score >= 75 ? "text-[#61f6c2]" : "text-amber-300"}>{readiness.score}%</strong></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-gradient-to-r from-[#746cff] to-[#61f6c2] transition-all duration-500" style={{ width: `${readiness.score}%` }} /></div>
            <div className="mt-3 flex flex-wrap gap-2">{readiness.checks.map(({ label, passed }) => <span key={label} className={`rounded-full border px-2 py-1 text-[8px] ${passed ? "border-[#61f6c2]/10 bg-[#61f6c2]/[.04] text-[#79f7cb]" : "border-white/[.06] text-slate-700"}`}>{passed ? "✓" : "+"} {label}</span>)}</div>
            {readiness.nextSuggestion && <p className="mt-3 rounded-lg border border-[#ffbf69]/10 bg-[#ffbf69]/[.035] px-3 py-2 text-[10px] leading-4 text-[#d8c199]"><strong className="text-[#ffcf8c]">Next:</strong> {readiness.nextSuggestion}</p>}
          </div>
          {!walletVerified && (
            <div className="flex items-start gap-3 rounded-xl border border-violet-400/20 bg-violet-400/[.07] p-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-200">
                <Wallet size={15} />
              </span>
              <div>
                <strong className="block text-xs text-slate-100">Wallet verification required</strong>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Connect Freighter on Stellar Testnet before AgentRail sends a mission to Copilot.
                </p>
              </div>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button
              size="lg"
              onClick={() => walletVerified ? void generate() : void onConnect()}
              disabled={loading || connecting}
            >
              {loading ? (
                <LoadingState label="Designing mission" variant="Dots" className="text-white [&_span]:text-white" />
              ) : connecting ? (
                <LoadingState label="Connecting wallet" variant="Dots" className="text-white [&_span]:text-white" />
              ) : !walletVerified ? (
                <><Wallet size={16} />Connect wallet to generate</>
              ) : (
                <><Sparkles size={16} />Generate mission plan</>
              )}
            </Button>
            {loading && (
              <Button size="lg" variant="destructive" onClick={stopGeneration}>
                <Square size={13} fill="currentColor" /> Stop
              </Button>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">
            The Gemini key stays in a Vercel server function and is never exposed to the
            browser. Generated scopes should be reviewed before funding.
          </p>
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[.045] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <ShieldCheck size={14} />
              Copilot security rules
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                "Wallet signature required",
                "Stellar Testnet enforced",
                "Secrets blocked before AI",
                "Human review before funding",
              ].map((rule) => (
                <span key={rule} className="flex items-center gap-2 text-[10px] text-slate-400">
                  <CheckCircle2 size={11} className="text-emerald-300" />
                  {rule}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[620px] overflow-hidden">
        {!plan ? (
          <div className="grid h-full min-h-[620px] place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-violet-400/15 bg-violet-400/[.07] text-violet-300">
                <Bot size={28} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-200">Your mission plan appears here</h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-600">
                Use it as the canonical off-chain brief. AgentRail hashes the final text
                before escrow funding so either party can later verify it.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-5 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={source === "gemini" ? "default" : "secondary"}>
                    {source === "gemini" ? "Gemini generated" : "Local template"}
                  </Badge>
                  <span className="text-[10px] text-slate-700">Review before funding</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{plan.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy mission plan"
                onClick={() => {
                  void navigator.clipboard.writeText(missionPlanToBrief(plan));
                  toast.success("Mission plan copied");
                }}
              >
                <Copy size={15} />
              </Button>
            </div>
            <p className="text-sm leading-6 text-slate-400">{plan.summary}</p>
            <MissionQuality plan={plan} />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                <CircleDollarSign size={15} className="text-emerald-300" />
                <span className="mt-3 block text-[9px] uppercase tracking-wider text-slate-600">
                  Suggested budget
                </span>
                <strong className="mt-1 block text-sm text-slate-200">
                  {plan.recommendedBudgetXlm} XLM
                </strong>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                <Clock3 size={15} className="text-violet-300" />
                <span className="mt-3 block text-[9px] uppercase tracking-wider text-slate-600">
                  Deadline
                </span>
                <strong className="mt-1 block text-sm text-slate-200">
                  {plan.deadlineLedgers.toLocaleString()} ledgers
                </strong>
              </div>
            </div>
            <PlanList icon={CheckCircle2} title="Deliverables" items={plan.deliverables} tone="emerald" />
            <PlanList
              icon={CheckCircle2}
              title="Acceptance criteria"
              items={plan.acceptanceCriteria}
              tone="violet"
            />
            <PlanList icon={ShieldAlert} title="Risks" items={plan.risks} tone="amber" />
            <Button onClick={() => onUsePlan(plan)}>
              Use this plan in escrow <ArrowRight size={15} />
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  );
}

function PlanList({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  tone: "emerald" | "violet" | "amber";
}) {
  const toneClass = {
    emerald: "text-emerald-300 bg-emerald-400/10",
    violet: "text-violet-300 bg-violet-400/10",
    amber: "text-amber-300 bg-amber-400/10",
  }[tone];
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-600">{title}</p>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2.5 text-xs leading-5 text-slate-400">
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ${toneClass}`}>
              <Icon size={11} />
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

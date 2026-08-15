import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import LoadingState from "@/components/ui/loading-state";

export type MissionPlan = {
  title: string;
  summary: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  risks: string[];
  recommendedBudgetXlm: number;
  deadlineLedgers: number;
};

const prompts = [
  "Research five Stellar payment tools and deliver a sourced comparison for a product team.",
  "Review our public API documentation and produce a prioritized developer-experience audit.",
  "Monitor a public dataset for anomalies and return a concise evidence-backed incident brief.",
];

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
}: {
  onUsePlan: (plan: MissionPlan) => void;
}) {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"gemini" | "template" | null>(null);
  const charCount = useMemo(() => goal.trim().length, [goal]);

  async function generate() {
    if (charCount < 20) {
      toast.error("Add more mission detail", {
        description: "Describe the goal, output, and intended use in at least 20 characters.",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const payload = (await response.json()) as MissionPlan & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Copilot request failed.");
      setPlan(payload);
      setSource("gemini");
    } catch (error) {
      setPlan(localDraft(goal));
      setSource("template");
      toast.info("AI endpoint is not configured", {
        description:
          error instanceof Error
            ? `${error.message} A safe local scope template was generated instead.`
            : "A safe local scope template was generated instead.",
      });
    } finally {
      setLoading(false);
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
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setGoal(prompt)}
                className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-left text-[10px] text-slate-500 transition hover:border-violet-400/25 hover:text-slate-300"
              >
                {prompt.split(" ").slice(0, 5).join(" ")}…
              </button>
            ))}
          </div>
          <div className="relative">
            <Textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={9}
              maxLength={2000}
              placeholder="Describe the business goal, expected output, constraints, and what a successful result looks like…"
              className="resize-none bg-slate-950/70 pb-10 text-sm leading-6"
            />
            <span className="absolute bottom-3 right-3 text-[10px] text-slate-700">
              {charCount}/2000
            </span>
          </div>
          <Button size="lg" onClick={generate} disabled={loading}>
            {loading ? (
              <LoadingState label="Designing mission" variant="Dots" className="text-slate-950 [&_span]:text-slate-950" />
            ) : (
              <><Sparkles size={16} />Generate mission plan</>
            )}
          </Button>
          <p className="text-xs leading-5 text-slate-500">
            The Gemini key stays in a Vercel server function and is never exposed to the
            browser. Generated scopes should be reviewed before funding.
          </p>
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

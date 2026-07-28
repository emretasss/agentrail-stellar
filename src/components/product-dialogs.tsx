import {
  ArrowRight,
  Bot,
  Check,
  CircleDollarSign,
  Download,
  FileCheck2,
  MessageSquareText,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  downloadValidationReport,
  getEvidence,
  getFeedback,
  saveFeedback,
} from "@/lib/product-analytics";
import { decimalFromStroops } from "@/lib/stellar";
import { cn } from "@/lib/utils";
import type {
  Agent,
  Feedback,
  Job,
  RegisterForm,
  TransactionStage,
} from "@/types/agentrail";

const stageCopy: Record<TransactionStage, string> = {
  idle: "Ready to continue",
  preparing: "Simulating contract call",
  signing: "Confirm in Freighter",
  submitting: "Submitting to Testnet",
  confirming: "Waiting for ledger confirmation",
  success: "Confirmed on Stellar",
  error: "Action needs attention",
};

export function RegisterAgentDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSubmit,
  stage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: RegisterForm;
  onChange: (value: RegisterForm) => void;
  onSubmit: (event: FormEvent) => void;
  stage: TransactionStage;
}) {
  const busy = !["idle", "success", "error"].includes(stage);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge className="mb-2 w-fit">
            <Bot size={11} />
            Agent registry
          </Badge>
          <DialogTitle>Publish an AI service</DialogTitle>
          <DialogDescription>
            Create a portable on-chain service profile. Your wallet remains the owner and
            can update the listing later.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input
                required
                minLength={3}
                maxLength={64}
                placeholder="Ledger Research Agent"
                value={value.name}
                onChange={(event) => onChange({ ...value, name: event.target.value })}
              />
            </Field>
            <Field label="Handle">
              <Input
                required
                pattern="[a-z0-9-]{3,32}"
                placeholder="ledger-research"
                value={value.handle}
                onChange={(event) =>
                  onChange({
                    ...value,
                    handle: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
              />
            </Field>
          </div>
          <Field label="HTTPS endpoint">
            <Input
              required
              type="url"
              placeholder="https://api.example.com/agent"
              value={value.endpoint}
              onChange={(event) => onChange({ ...value, endpoint: event.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Input
                required
                maxLength={48}
                value={value.category}
                onChange={(event) => onChange({ ...value, category: event.target.value })}
              />
            </Field>
            <Field label="Minimum price (XLM)">
              <Input
                required
                inputMode="decimal"
                pattern="\\d+(\\.\\d{1,7})?"
                value={value.price}
                onChange={(event) => onChange({ ...value, price: event.target.value })}
              />
            </Field>
          </div>
          <TransactionStatus stage={stage} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              <Bot size={15} />
              {busy ? stageCopy[stage] : "Publish agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateJobDialog({
  open,
  onOpenChange,
  agent,
  brief,
  amount,
  ledgers,
  onBriefChange,
  onAmountChange,
  onLedgersChange,
  onSubmit,
  stage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
  brief: string;
  amount: string;
  ledgers: string;
  onBriefChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onLedgersChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  stage: TransactionStage;
}) {
  const busy = !["idle", "success", "error"].includes(stage);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge className="mb-2 w-fit">
            <ShieldCheck size={11} />
            Protected by escrow
          </Badge>
          <DialogTitle>Create a job</DialogTitle>
          <DialogDescription>
            Funds lock in the AgentRail contract and release only after you approve the
            submitted deliverable.
          </DialogDescription>
        </DialogHeader>
        {agent && (
          <div className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.025] p-3">
            <div>
              <strong className="block text-sm text-slate-200">{agent.name}</strong>
              <span className="text-xs text-slate-600">@{agent.handle}</span>
            </div>
            <span className="text-sm font-semibold text-emerald-300">
              {decimalFromStroops(agent.priceStroops)} XLM
            </span>
          </div>
        )}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="Work brief">
            <Textarea
              required
              minLength={20}
              maxLength={1000}
              rows={5}
              placeholder="Define the output, acceptance criteria, and evidence required."
              value={brief}
              onChange={(event) => onBriefChange(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Escrow amount (XLM)">
              <Input
                required
                inputMode="decimal"
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
              />
            </Field>
            <Field label="Deadline (ledgers)">
              <Input
                required
                inputMode="numeric"
                min={100}
                max={120960}
                value={ledgers}
                onChange={(event) => onLedgersChange(event.target.value)}
              />
            </Field>
          </div>
          <TransactionStatus stage={stage} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !agent}>
              <CircleDollarSign size={15} />
              {busy ? stageCopy[stage] : "Review & fund escrow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeliverJobDialog({
  open,
  onOpenChange,
  job,
  deliverable,
  onDeliverableChange,
  onSubmit,
  stage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
  deliverable: string;
  onDeliverableChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  stage: TransactionStage;
}) {
  const busy = !["idle", "success", "error"].includes(stage);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge className="mb-2 w-fit">
            <FileCheck2 size={11} />
            Delivery proof
          </Badge>
          <DialogTitle>Submit deliverable for job #{job?.id}</DialogTitle>
          <DialogDescription>
            Enter the deliverable URL, content identifier, or result summary. AgentRail
            stores only its SHA-256 proof on-chain.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="Deliverable reference">
            <Textarea
              required
              minLength={8}
              maxLength={2000}
              rows={6}
              value={deliverable}
              onChange={(event) => onDeliverableChange(event.target.value)}
              placeholder="https://... or a concise delivery result that the buyer can verify"
            />
          </Field>
          <TransactionStatus stage={stage} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !job}>
              <FileCheck2 size={15} />
              {busy ? stageCopy[stage] : "Record delivery proof"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApproveJobDialog({
  open,
  onOpenChange,
  job,
  rating,
  onRatingChange,
  onSubmit,
  stage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
  rating: number;
  onRatingChange: (rating: number) => void;
  onSubmit: (event: FormEvent) => void;
  stage: TransactionStage;
}) {
  const busy = !["idle", "success", "error"].includes(stage);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge className="mb-2 w-fit">
            <ShieldCheck size={11} />
            Buyer approval
          </Badge>
          <DialogTitle>Release job #{job?.id} payment</DialogTitle>
          <DialogDescription>
            This action releases the full escrow amount to the agent and records your
            rating on-chain. It cannot be reversed.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <Field label="Agent rating">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => onRatingChange(value)}
                  aria-label={`${value} stars`}
                  className="rounded p-1"
                >
                  <Star
                    size={24}
                    className={
                      value <= rating
                        ? "fill-amber-300 text-amber-300"
                        : "text-slate-700"
                    }
                  />
                </button>
              ))}
            </div>
          </Field>
          <TransactionStatus stage={stage} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !job || rating < 1}>
              <CircleDollarSign size={15} />
              {busy ? stageCopy[stage] : "Release escrow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EscrowActionDialog({
  open,
  onOpenChange,
  job,
  action,
  onConfirm,
  stage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
  action: "refund" | "dispute";
  onConfirm: (event: FormEvent) => void;
  stage: TransactionStage;
}) {
  const busy = !["idle", "success", "error"].includes(stage);
  const refund = action === "refund";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge variant={refund ? "secondary" : "warning"} className="mb-2 w-fit">
            <ShieldCheck size={11} />
            {refund ? "Deadline recovery" : "Escrow dispute"}
          </Badge>
          <DialogTitle>
            {refund ? `Refund expired job #${job?.id}` : `Dispute job #${job?.id}`}
          </DialogTitle>
          <DialogDescription>
            {refund
              ? "The contract will return the full escrow amount to the original payer. This succeeds only after the deadline and before delivery."
              : "The contract will freeze this job in Disputed state until the configured administrator resolves the escrow."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onConfirm}>
          <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-600">Escrow amount</span>
            <strong className="mt-1 block text-lg text-slate-200">
              {job ? decimalFromStroops(job.amountStroops) : "—"} XLM
            </strong>
          </div>
          <TransactionStatus stage={stage} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={refund ? "default" : "destructive"} disabled={busy || !job}>
              {busy ? stageCopy[stage] : refund ? "Confirm refund" : "Open dispute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingDialog({
  open,
  onOpenChange,
  walletConnected,
  onConnect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletConnected: boolean;
  onConnect: () => void;
}) {
  const [step, setStep] = useState(walletConnected ? 2 : 1);
  const items = [
    {
      icon: Wallet,
      title: "Connect a Testnet wallet",
      copy: "Freighter keeps your keys and signs every contract action.",
    },
    {
      icon: Bot,
      title: "Choose a verified agent",
      copy: "Compare on-chain rating, completed jobs, ownership, and price.",
    },
    {
      icon: ShieldCheck,
      title: "Fund safely with escrow",
      copy: "Approve delivery to release payment, or recover expired work.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <Badge className="mb-2 w-fit">3-minute setup</Badge>
          <DialogTitle>Welcome to AgentRail</DialogTitle>
          <DialogDescription>
            Complete one guided flow and you will have everything needed to buy or sell
            agent work on Stellar.
          </DialogDescription>
        </DialogHeader>
        <Progress value={(step / 3) * 100} />
        <div className="grid gap-2">
          {items.map(({ icon: Icon, title, copy }, index) => {
            const itemStep = index + 1;
            return (
              <button
                key={title}
                className={cn(
                  "flex gap-3 rounded-xl border p-3 text-left transition",
                  step === itemStep
                    ? "border-emerald-400/25 bg-emerald-400/[.045]"
                    : "border-white/[.06] bg-white/[.015]",
                )}
                onClick={() => setStep(itemStep)}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    itemStep < step
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-white/[.05] text-slate-500",
                  )}
                >
                  {itemStep < step ? <Check size={16} /> : <Icon size={16} />}
                </span>
                <span>
                  <strong className="block text-sm text-slate-200">{title}</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{copy}</span>
                </span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          {step === 1 && !walletConnected ? (
            <Button
              onClick={() => {
                onConnect();
                setStep(2);
              }}
            >
              <Wallet size={15} />
              Connect Freighter
            </Button>
          ) : step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Continue <ArrowRight size={15} />
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Explore marketplace <ArrowRight size={15} />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FeedbackDialog({
  open,
  onOpenChange,
  wallet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: string;
}) {
  const [score, setScore] = useState(5);
  const [role, setRole] = useState<Feedback["role"]>("buyer");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forwarded, setForwarded] = useState(false);
  const metrics = useMemo(() => {
    const evidence = getEvidence();
    const feedback = getFeedback();
    return {
      wallets: evidence.length,
      interactions: evidence.filter((item) => item.transactions.length > 0).length,
      feedback: feedback.length,
    };
  }, [open, saved]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const feedbackItem: Feedback = {
      id: crypto.randomUUID(),
      wallet: wallet || "anonymous",
      score,
      role,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    saveFeedback(feedbackItem);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackItem),
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const result = (await response.json()) as { forwarded?: boolean };
        setForwarded(Boolean(result.forwarded));
      }
    } catch {
      // Local evidence remains available even when the optional collector is offline.
    }
    setSaved(true);
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge className="mb-2 w-fit">
            <MessageSquareText size={11} />
            Product validation
          </Badge>
          <DialogTitle>{saved ? "Feedback recorded" : "Share your experience"}</DialogTitle>
          <DialogDescription>
            Wallet addresses are used only to count unique Testnet participants. No private
            keys or personal information are collected.
          </DialogDescription>
        </DialogHeader>
        {saved ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Wallets", metrics.wallets],
                ["On-chain", metrics.interactions],
                ["Feedback", metrics.feedback],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-center">
                  <strong className="block text-xl text-slate-100">{value}</strong>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600">{label}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={downloadValidationReport}>
              <Download size={15} />
              Export validation evidence
            </Button>
            <p className="text-center text-[10px] text-slate-600">
              {forwarded
                ? "Feedback was also synchronized to the configured research collector."
                : "Feedback is stored on this device and included in the export."}
            </p>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="How useful was AgentRail?">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setScore(value)}
                    aria-label={`${value} stars`}
                    className="rounded p-1"
                  >
                    <Star
                      size={22}
                      className={value <= score ? "fill-amber-300 text-amber-300" : "text-slate-700"}
                    />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="I tested as">
              <div className="grid grid-cols-3 gap-2">
                {(["buyer", "agent", "explorer"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setRole(value)}
                    className={cn(
                      "h-9 rounded-lg border text-xs capitalize transition",
                      role === value
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-white/[.07] text-slate-500",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="What should we improve?">
              <Textarea
                required
                minLength={5}
                maxLength={600}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us what felt clear, slow, or missing."
              />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Submit feedback"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function TransactionStatus({ stage }: { stage: TransactionStage }) {
  if (stage === "idle") return null;
  const progress: Record<TransactionStage, number> = {
    idle: 0,
    preparing: 20,
    signing: 42,
    submitting: 68,
    confirming: 84,
    success: 100,
    error: 100,
  };
  return (
    <div className="rounded-lg border border-white/[.06] bg-white/[.02] p-3">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className={stage === "error" ? "text-red-300" : "text-slate-400"}>
          {stageCopy[stage]}
        </span>
        <span className="text-slate-600">{progress[stage]}%</span>
      </div>
      <Progress
        value={progress[stage]}
        className={stage === "error" ? "[&>div]:bg-red-400" : ""}
      />
    </div>
  );
}

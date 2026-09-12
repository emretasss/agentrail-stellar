import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileKey2,
  Flag,
  Layers3,
  LockKeyhole,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { decimalFromStroops } from "@/lib/stellar";
import type {
  Agent,
  Job,
  MilestoneDraft,
  MilestonePlan,
  SettlementAsset,
} from "@/types/agentrail";

type CreateMilestoneMission = {
  agentId: number;
  brief: string;
  milestones: MilestoneDraft[];
  assetToken: string;
};

type MilestoneStudioProps = {
  agents: Agent[];
  jobs: Job[];
  plans: MilestonePlan[];
  assets: SettlementAsset[];
  walletAddress?: string;
  latestLedger: number | null;
  busy: string | null;
  onCreate: (mission: CreateMilestoneMission) => Promise<void>;
  onDeliver: (plan: MilestonePlan, proof: string) => Promise<void>;
  onApprove: (plan: MilestonePlan, rating: number) => Promise<void>;
  onRefund: (plan: MilestonePlan) => Promise<void>;
};

const initialDrafts: MilestoneDraft[] = [
  { title: "Discovery and evidence map", amount: "0.02", ledgerOffset: "1200" },
  { title: "Working result and validation", amount: "0.02", ledgerOffset: "2400" },
  { title: "Final package and audit proof", amount: "0.02", ledgerOffset: "3600" },
];

function shortAddress(value?: string) {
  if (!value) return "—";
  return value.length > 16 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
}

function statusTone(status: string) {
  if (status === "Released") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "Delivered") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  if (status === "Refunded") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  return "border-[#746cff]/25 bg-[#746cff]/10 text-[#b8b4ff]";
}

export function MilestoneStudio({
  agents,
  jobs,
  plans,
  assets,
  walletAddress,
  latestLedger,
  busy,
  onCreate,
  onDeliver,
  onApprove,
  onRefund,
}: MilestoneStudioProps) {
  const [mode, setMode] = useState<"portfolio" | "create">("portfolio");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.jobId ?? 0);
  const [agentId, setAgentId] = useState(agents[0]?.id ?? 0);
  const [brief, setBrief] = useState("");
  const [assetToken, setAssetToken] = useState(
    assets.find((asset) => asset.enabled && asset.decimals === 7)?.token ?? "",
  );
  const [drafts, setDrafts] = useState<MilestoneDraft[]>(initialDrafts);
  const [proof, setProof] = useState("");
  const [rating, setRating] = useState(5);

  const selectedPlan = plans.find(({ jobId }) => jobId === selectedPlanId) ?? plans[0];
  const selectedJob = jobs.find(({ id }) => id === selectedPlan?.jobId);
  const currentMilestone = selectedPlan?.milestones[selectedPlan.currentIndex];
  const completedMilestones = plans.reduce(
    (sum, plan) => sum + plan.milestones.filter(({ status }) => status === "Released").length,
    0,
  );
  const milestoneCount = plans.reduce((sum, plan) => sum + plan.milestones.length, 0);
  const progress = selectedPlan?.milestones.length
    ? Math.round((selectedPlan.currentIndex / selectedPlan.milestones.length) * 100)
    : 0;
  const selectedAgent = agents.find(({ id }) => id === agentId);
  const selectedAsset = assets.find(({ token }) => token === assetToken) ?? assets[0];
  const draftTotal = useMemo(
    () => drafts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [drafts],
  );

  function updateDraft(index: number, field: keyof MilestoneDraft, value: string) {
    setDrafts((current) =>
      current.map((draft, cursor) => (cursor === index ? { ...draft, [field]: value } : draft)),
    );
  }

  async function submitMission(event: FormEvent) {
    event.preventDefault();
    try {
      await onCreate({ agentId, brief, milestones: drafts, assetToken });
      setMode("portfolio");
      setBrief("");
      setDrafts(initialDrafts);
    } catch {
      // The parent reports the transaction error with a contextual toast.
    }
  }

  const isAgent = Boolean(
    selectedJob?.agentOwner && walletAddress === selectedJob.agentOwner,
  );
  const isPayer = Boolean(selectedJob?.payer && walletAddress === selectedJob.payer);
  const finalMilestone = Boolean(
    selectedPlan && selectedPlan.currentIndex === selectedPlan.milestones.length - 1,
  );
  const deadlinePassed = Boolean(
    currentMilestone && latestLedger && latestLedger > currentMilestone.deadlineLedger,
  );

  return (
    <div className="grid min-w-0 gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.075] bg-[#090a18] p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 size-72 rounded-full bg-cyan-400/[.08] blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-[#746cff]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">
              <Layers3 size={13} /> Multi-asset milestone protocol · v0.6
            </div>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.05em] text-white sm:text-4xl">
              Ship complex agent work without releasing the whole budget at once.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              One mission, multiple verifiable deliverables. Each accepted milestone releases only
              its own escrow slice while the remainder stays protected on Stellar.
            </p>
          </div>
          <div className="flex rounded-xl border border-white/[.08] bg-black/20 p-1">
            {(["portfolio", "create"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${
                  mode === item ? "bg-white/[.09] text-white" : "text-slate-600 hover:text-slate-300"
                }`}
              >
                {item === "portfolio" ? "Mission control" : "Create staged mission"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {mode === "portfolio" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [WalletCards, "Protected routes", `${plans.length} missions`, "SAC-backed settlement vaults"],
              [CircleDollarSign, "Settlement assets", `${assets.filter(({ enabled }) => enabled).length} enabled`, "Allowlisted SEP-41 interfaces"],
              [CheckCircle2, "Milestones cleared", `${completedMilestones}/${milestoneCount}`, "Settlement-backed progress"],
              [ShieldCheck, "Active plans", String(plans.length), "Sequential execution enforced"],
            ].map(([Icon, label, value, detail]) => (
              <article key={String(label)} className="rounded-2xl border border-white/[.07] bg-[#0a0b19]/75 p-5">
                <Icon className="text-[#8fe9ff]" size={18} />
                <p className="mt-5 text-[9px] font-bold uppercase tracking-[.16em] text-slate-600">{String(label)}</p>
                <strong className="mt-1 block text-2xl tracking-tight text-white">{String(value)}</strong>
                <span className="mt-1 block text-[10px] text-slate-600">{String(detail)}</span>
              </article>
            ))}
          </section>

          {!plans.length ? (
            <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/[.1] bg-[#090a17]/60 p-8 text-center">
              <div className="max-w-md">
                <Flag className="mx-auto text-[#8fe9ff]" size={26} />
                <h3 className="mt-4 text-lg font-semibold text-white">No staged missions yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Build the first multi-deliverable mission and lock its complete budget in one transaction.
                </p>
                <Button className="mt-5" onClick={() => setMode("create")}>
                  <Plus size={14} /> Create milestone plan
                </Button>
              </div>
            </section>
          ) : (
            <section className="grid gap-4 xl:grid-cols-[.42fr_.58fr]">
              <div className="grid content-start gap-2">
                {plans.map((plan) => {
                  const job = jobs.find(({ id }) => id === plan.jobId);
                  const active = selectedPlan?.jobId === plan.jobId;
                  const planProgress = Math.round((plan.currentIndex / plan.milestones.length) * 100);
                  return (
                    <button
                      key={plan.jobId}
                      onClick={() => setSelectedPlanId(plan.jobId)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#746cff]/35 bg-[#746cff]/[.08]"
                          : "border-white/[.07] bg-[#090a17]/70 hover:border-white/[.14]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-white">Mission #{plan.jobId}</span>
                        <Badge variant={job?.status === "Released" ? "default" : "secondary"}>{job?.status ?? "Staged"}</Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500">{job?.brief ?? "Private on-chain mission brief"}</p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-gradient-to-r from-[#746cff] to-[#78e8ff]" style={{ width: `${planProgress}%` }} /></div>
                      <div className="mt-2 flex justify-between text-[9px] text-slate-600"><span>{plan.currentIndex}/{plan.milestones.length} released</span><span>{decimalFromStroops(plan.milestones.reduce((sum, item) => sum + item.amountStroops, 0n))} {job?.assetCode ?? "XLM"}</span></div>
                    </button>
                  );
                })}
              </div>

              {selectedPlan && selectedJob && (
                <article className="rounded-2xl border border-white/[.075] bg-[#090a17]/80 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#aaa5ff]"><LockKeyhole size={12} /> Staged escrow #{selectedPlan.jobId}</div>
                      <h3 className="mt-2 text-xl font-semibold text-white">{selectedJob.brief}</h3>
                      <p className="mt-2 text-[10px] text-slate-600">Buyer {shortAddress(selectedJob.payer)} · Agent {shortAddress(selectedJob.agentOwner)}</p>
                    </div>
                    {!selectedPlan.chainBacked && <Badge variant="warning">Interactive preview</Badge>}
                  </div>

                  <div className="mt-6 grid gap-3">
                    {selectedPlan.milestones.map((milestone, index) => {
                      const isCurrent = index === selectedPlan.currentIndex;
                      return (
                        <div key={milestone.index} className={`relative rounded-xl border p-4 ${isCurrent ? "border-cyan-400/25 bg-cyan-400/[.045]" : "border-white/[.06] bg-white/[.018]"}`}>
                          <div className="flex items-start gap-3">
                            <span className={`grid size-8 shrink-0 place-items-center rounded-full border ${statusTone(milestone.status)}`}>
                              {milestone.status === "Released" ? <Check size={14} /> : index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <strong className="text-xs text-slate-200">Milestone {index + 1}</strong>
                                <div className="flex items-center gap-2"><Badge className={statusTone(milestone.status)}>{milestone.status}</Badge><span className="text-xs font-semibold text-white">{decimalFromStroops(milestone.amountStroops)} {selectedJob.assetCode ?? "XLM"}</span></div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-600"><span className="flex items-center gap-1"><Clock3 size={10} /> Ledger {milestone.deadlineLedger.toLocaleString()}</span><span className="flex items-center gap-1"><FileKey2 size={10} /> {milestone.briefHash.slice(0, 12)}…</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-xl border border-white/[.07] bg-black/20 p-4">
                    <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500">Settlement progress</span><strong className="text-white">{progress}%</strong></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-gradient-to-r from-[#746cff] via-[#8a7dff] to-[#78e8ff]" style={{ width: `${progress}%` }} /></div>
                    {currentMilestone && selectedPlan.chainBacked && (
                      <div className="mt-4 grid gap-3">
                        {currentMilestone.status === "Funded" && isAgent && (
                          <div className="flex flex-col gap-2 sm:flex-row"><Input value={proof} onChange={(event) => setProof(event.target.value)} placeholder="Delivery URL, CID, or result summary" /><Button disabled={!proof.trim() || Boolean(busy)} onClick={() => void onDeliver(selectedPlan, proof).catch(() => undefined)}><Send size={13} /> Record proof</Button></div>
                        )}
                        {currentMilestone.status === "Delivered" && isPayer && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><p className="mr-auto text-xs text-cyan-200">Evidence recorded. Approve to release this slice.</p>{finalMilestone && <select aria-label="Final mission rating" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white">{[5,4,3,2,1].map((score) => <option key={score} value={score}>{score} stars</option>)}</select>}<Button disabled={Boolean(busy)} onClick={() => void onApprove(selectedPlan, finalMilestone ? rating : 0).catch(() => undefined)}><CheckCircle2 size={13} /> Approve {decimalFromStroops(currentMilestone.amountStroops)} {selectedJob.assetCode ?? "XLM"}</Button></div>
                        )}
                        {deadlinePassed && isPayer && currentMilestone.status === "Funded" && (
                          <Button variant="outline" disabled={Boolean(busy)} onClick={() => void onRefund(selectedPlan).catch(() => undefined)}><RotateCcw size={13} /> Refund remaining escrow</Button>
                        )}
                        {!walletAddress && <p className="text-[10px] text-slate-600">Connect the buyer or agent wallet to execute the next on-chain action.</p>}
                      </div>
                    )}
                    {!selectedPlan.chainBacked && <p className="mt-4 flex items-center gap-2 text-[10px] text-amber-300/80"><Sparkles size={11} /> Preview data demonstrates the complete staged settlement lifecycle.</p>}
                  </div>
                </article>
              )}
            </section>
          )}
        </>
      ) : (
        <form onSubmit={submitMission} className="grid gap-4 xl:grid-cols-[.38fr_.62fr]">
          <aside className="rounded-2xl border border-white/[.075] bg-[#090a17]/75 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#aaa5ff]"><ShieldCheck size={13} /> Mission policy</div>
            <h3 className="mt-3 text-xl font-semibold text-white">Define the protected outcome.</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">The full budget locks once. Deliverables must clear in order, so later work cannot bypass earlier acceptance.</p>
            <label className="mt-5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verified agent</label>
            <select value={agentId} onChange={(event) => setAgentId(Number(event.target.value))} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              <option value={0}>Choose an agent</option>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>@{agent.handle} · {decimalFromStroops(agent.priceStroops)} XLM min</option>)}
            </select>
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Settlement asset</label>
            <select value={assetToken} onChange={(event) => setAssetToken(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              {assets.filter((asset) => asset.enabled && asset.decimals === 7).map((asset) => <option key={asset.token} value={asset.token}>{asset.code} · SEP-41 / SAC route</option>)}
            </select>
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Mission brief</label>
            <Textarea value={brief} onChange={(event) => setBrief(event.target.value)} className="mt-2 min-h-32" placeholder="Describe the outcome, constraints, approved sources, and acceptance policy…" />
            <div className="mt-5 rounded-xl border border-white/[.06] bg-black/20 p-4 text-[10px] text-slate-500">
              <div className="flex justify-between"><span>Total staged budget</span><strong className="text-white">{draftTotal.toFixed(7).replace(/0+$/, "").replace(/\.$/, "")} {selectedAsset?.code ?? "asset"}</strong></div>
              <div className="mt-2 flex justify-between"><span>Agent minimum</span><strong className="text-white">{selectedAgent ? decimalFromStroops(selectedAgent.priceStroops) : "—"} {selectedAsset?.code ?? "asset"}</strong></div>
            </div>
          </aside>

          <section className="rounded-2xl border border-white/[.075] bg-[#090a17]/75 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300">Release schedule</div><h3 className="mt-2 text-xl font-semibold text-white">Turn acceptance into payment rails.</h3></div><Badge variant="secondary">{drafts.length}/8 stages</Badge></div>
            <div className="mt-6 grid gap-3">
              {drafts.map((draft, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-white/[.065] bg-white/[.018] p-4 lg:grid-cols-[auto_1fr_8rem_9rem_auto] lg:items-end">
                  <span className="grid size-8 place-items-center rounded-full border border-[#746cff]/25 bg-[#746cff]/10 text-xs font-semibold text-[#c1bdff]">{index + 1}</span>
                  <label className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Deliverable<Input required value={draft.title} onChange={(event) => updateDraft(index, "title", event.target.value)} className="mt-2" /></label>
                  <label className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Amount {selectedAsset?.code ?? "asset"}<Input required inputMode="decimal" value={draft.amount} onChange={(event) => updateDraft(index, "amount", event.target.value)} className="mt-2" /></label>
                  <label className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Deadline offset<Input required inputMode="numeric" value={draft.ledgerOffset} onChange={(event) => updateDraft(index, "ledgerOffset", event.target.value)} className="mt-2" /></label>
                  <button type="button" disabled={drafts.length <= 2} onClick={() => setDrafts((current) => current.filter((_, cursor) => cursor !== index))} className="grid size-9 place-items-center rounded-lg border border-white/[.07] text-slate-600 transition hover:border-red-400/20 hover:text-red-300 disabled:opacity-25" aria-label={`Remove milestone ${index + 1}`}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-white/[.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" disabled={drafts.length >= 8} onClick={() => setDrafts((current) => [...current, { title: "Next verifiable deliverable", amount: "0.01", ledgerOffset: String((current.length + 1) * 1200) }])}><Plus size={13} /> Add stage</Button>
              <div className="flex items-center gap-3"><span className="hidden items-center gap-1 text-[9px] text-slate-600 sm:flex"><AlertTriangle size={10} /> Deadlines must increase</span><Button type="submit" disabled={Boolean(busy) || !agentId || brief.trim().length < 20}><LockKeyhole size={13} /> Lock staged escrow <ArrowRight size={12} /></Button></div>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}

export type { CreateMilestoneMission };

import { MessageSquareText } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/components/dashboard-overview";
import { JobActivity } from "@/components/job-activity";
import { Marketplace } from "@/components/marketplace";
import {
  ApproveJobDialog,
  CreateJobDialog,
  DeliverJobDialog,
  FeedbackDialog,
  OnboardingDialog,
  RegisterAgentDialog,
} from "@/components/product-dialogs";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  initialActivity,
  initialRegisterForm,
  sampleAgents,
  sampleJobs,
} from "@/data/demo";
import { captureProductError } from "@/lib/monitoring";
import {
  recordWalletConnection,
  recordWalletTransaction,
  trackEvent,
} from "@/lib/product-analytics";
import {
  checkFreighter,
  connectFreighter,
  decimalFromStroops,
  getLatestLedgerSequence,
  loadProtocolSnapshot,
  scVal,
  sha256Hex,
  stroopsFromDecimal,
  submitAgentRailCall,
  stellarConfig,
  type WalletState,
} from "@/lib/stellar";
import type {
  ActivityEvent,
  Agent,
  Job,
  RegisterForm,
  TransactionStage,
} from "@/types/agentrail";

function App() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [agents, setAgents] = useState<Agent[]>(
    stellarConfig.demoMode ? sampleAgents : [],
  );
  const [jobs, setJobs] = useState<Job[]>(
    stellarConfig.demoMode ? sampleJobs : [],
  );
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity);
  const [selectedAgentId, setSelectedAgentId] = useState(
    stellarConfig.demoMode ? sampleAgents[0].id : 0,
  );
  const [registerForm, setRegisterForm] =
    useState<RegisterForm>(initialRegisterForm);
  const [brief, setBrief] = useState("");
  const [jobAmount, setJobAmount] = useState(
    stellarConfig.demoMode
      ? decimalFromStroops(sampleAgents[0].priceStroops)
      : "0.05",
  );
  const [deadlineLedgers, setDeadlineLedgers] = useState("1200");
  const [busy, setBusy] = useState<string | null>(null);
  const [transactionStage, setTransactionStage] =
    useState<TransactionStage>("idle");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [deliverable, setDeliverable] = useState("");
  const [rating, setRating] = useState(5);
  const [dataMode, setDataMode] = useState<"loading" | "live" | "demo" | "error">(
    "loading",
  );
  const [latestLedger, setLatestLedger] = useState<number | null>(null);

  useEffect(() => {
    void refreshProtocol();
    checkFreighter().then((connected) => {
      setWallet(connected);
      if (connected) recordWalletConnection(connected.address);
    });
    if (!window.localStorage.getItem("agentrail.onboarding.seen")) {
      const timer = window.setTimeout(() => setOnboardingOpen(true), 800);
      return () => window.clearTimeout(timer);
    }
  }, []);

  async function refreshProtocol() {
    try {
      const snapshot = await loadProtocolSnapshot();
      setAgents(snapshot.agents);
      setJobs(snapshot.jobs);
      setLatestLedger(snapshot.ledger);
      setDataMode("live");
      setSelectedAgentId((current) => {
        if (snapshot.agents.some((agent) => agent.id === current)) return current;
        return snapshot.agents[0]?.id ?? 0;
      });
      if (snapshot.agents[0]) {
        setJobAmount((current) =>
          current === "0.05"
            ? decimalFromStroops(snapshot.agents[0].priceStroops)
            : current,
        );
      }
    } catch (error) {
      captureProductError(error, { flow: "load_protocol_snapshot" });
      if (stellarConfig.demoMode) {
        setAgents(sampleAgents);
        setJobs(sampleJobs);
        setSelectedAgentId(sampleAgents[0].id);
        setDataMode("demo");
      } else {
        setAgents([]);
        setJobs([]);
        setDataMode("error");
      }
    }
  }

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  const stats = useMemo(() => {
    const locked = jobs
      .filter((job) => job.status === "Funded" || job.status === "Delivered")
      .reduce((total, job) => total + job.amountStroops, 0n);
    const released = jobs
      .filter((job) => job.status === "Released")
      .reduce((total, job) => total + job.amountStroops, 0n);
    return {
      agents: agents.filter((agent) => agent.active).length,
      jobs: jobs.length,
      locked: decimalFromStroops(locked),
      released: decimalFromStroops(released),
    };
  }, [agents, jobs]);

  function pushActivity(
    label: string,
    detail: string,
    tone: ActivityEvent["tone"] = "success",
    hash?: string,
  ) {
    setActivity((current) =>
      [
        {
          id: crypto.randomUUID(),
          label,
          detail,
          tone,
          hash,
          at: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 12),
    );
  }

  function resetTransaction() {
    setTransactionStage("idle");
  }

  async function handleConnect() {
    setBusy("wallet");
    try {
      const connected = await connectFreighter();
      setWallet(connected);
      recordWalletConnection(connected.address);
      pushActivity(
        "Wallet connected",
        `${connected.network} · ${connected.address.slice(0, 8)}…`,
      );
      toast.success("Freighter connected", {
        description: "Your wallet is ready for Testnet transactions.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connection failed.";
      captureProductError(error, { flow: "wallet_connect" });
      pushActivity("Wallet connection failed", message, "error");
      toast.error("Could not connect wallet", { description: message });
    } finally {
      setBusy(null);
    }
  }

  function requireWallet() {
    if (!wallet) {
      toast.error("Connect Freighter first", {
        description: "A Testnet wallet signature is required for this action.",
      });
      throw new Error("Wallet not connected.");
    }
    return wallet;
  }

  async function handleRegisterAgent(event: FormEvent) {
    event.preventDefault();
    setBusy("register");
    resetTransaction();
    try {
      const signer = requireWallet();
      const priceStroops = stroopsFromDecimal(registerForm.price);
      const result = await submitAgentRailCall(
        signer.address,
        "register_agent",
        [
          scVal.address(signer.address),
          scVal.string(registerForm.handle),
          scVal.string(registerForm.name),
          scVal.string(registerForm.endpoint),
          scVal.string(registerForm.category),
          scVal.i128(priceStroops),
        ],
        setTransactionStage,
      );
      const id =
        typeof result.returnValue === "bigint"
          ? Number(result.returnValue)
          : Math.max(...agents.map((agent) => agent.id)) + 1;
      const nextAgent: Agent = {
        id,
        ...registerForm,
        priceStroops,
        rating: 0,
        completed: 0,
        active: true,
        owner: signer.address,
        responseTime: "New",
        successRate: 100,
        verified: true,
        chainBacked: true,
      };
      setAgents((current) => [nextAgent, ...current]);
      setSelectedAgentId(id);
      recordWalletTransaction(signer.address, result.hash, "register_agent");
      pushActivity("Agent published", `@${nextAgent.handle} is live on Testnet.`, "success", result.hash);
      trackEvent("agent_published", { agentId: id });
      toast.success("Agent published on Stellar", {
        action: {
          label: "Explorer",
          onClick: () => window.open(result.explorerUrl, "_blank", "noopener,noreferrer"),
        },
      });
      setRegisterOpen(false);
      setRegisterForm(initialRegisterForm);
      await refreshProtocol();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent registration failed.";
      captureProductError(error, { flow: "register_agent" });
      pushActivity("Agent publish failed", message, "error");
      toast.error("Agent was not published", { description: message });
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateJob(event: FormEvent) {
    event.preventDefault();
    if (!selectedAgent) return;
    setBusy("fund");
    resetTransaction();
    try {
      const signer = requireWallet();
      const amount = stroopsFromDecimal(jobAmount);
      if (amount < selectedAgent.priceStroops) {
        throw new Error(
          `Escrow must be at least ${decimalFromStroops(selectedAgent.priceStroops)} XLM.`,
        );
      }
      if (!selectedAgent.chainBacked) {
        throw new Error("Demo listings cannot receive real escrow payments.");
      }
      const briefHash = await sha256Hex(brief.trim());
      const ledgerOffset = Number(deadlineLedgers);
      if (
        !Number.isInteger(ledgerOffset) ||
        ledgerOffset < 100 ||
        ledgerOffset > 120_960
      ) {
        throw new Error("Deadline must be between 100 and 120,960 ledgers.");
      }
      const currentLedger = await getLatestLedgerSequence();
      const result = await submitAgentRailCall(
        signer.address,
        "create_job",
        [
          scVal.address(signer.address),
          scVal.u64(selectedAgent.id),
          scVal.bytes32(briefHash),
          scVal.i128(amount),
          scVal.u32(currentLedger + ledgerOffset),
        ],
        setTransactionStage,
      );
      const id =
        typeof result.returnValue === "bigint"
          ? Number(result.returnValue)
          : Math.max(0, ...jobs.map((job) => job.id)) + 1;
      const job: Job = {
        id,
        agentId: selectedAgent.id,
        payer: signer.address,
        amountStroops: amount,
        status: "Funded",
        brief,
        briefHash,
        txHash: result.hash,
        createdAt: new Date().toISOString(),
        agentOwner: selectedAgent.owner,
        deadlineLedger: currentLedger + ledgerOffset,
        createdLedger: currentLedger,
        chainBacked: true,
      };
      setJobs((current) => [job, ...current]);
      recordWalletTransaction(signer.address, result.hash, "create_job");
      pushActivity(
        "Escrow funded",
        `${decimalFromStroops(amount)} XLM locked for @${selectedAgent.handle}.`,
        "success",
        result.hash,
      );
      toast.success("Escrow funded on Testnet");
      setJobOpen(false);
      setBrief("");
      await refreshProtocol();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Escrow funding failed.";
      captureProductError(error, { flow: "create_job" });
      pushActivity("Escrow funding failed", message, "error");
      toast.error("Could not fund escrow", { description: message });
    } finally {
      setBusy(null);
    }
  }

  function openDeliver(job: Job) {
    setSelectedJob(job);
    setDeliverable("");
    resetTransaction();
    setDeliverOpen(true);
  }

  async function handleDeliver(event: FormEvent) {
    event.preventDefault();
    if (!selectedJob) return;
    const job = selectedJob;
    setBusy(`deliver-${job.id}`);
    resetTransaction();
    try {
      const signer = requireWallet();
      if (!job.chainBacked) {
        throw new Error("Demo jobs cannot submit on-chain delivery proofs.");
      }
      const deliverableHash = await sha256Hex(deliverable.trim());
      const result = await submitAgentRailCall(
        signer.address,
        "deliver_job",
        [
          scVal.address(signer.address),
          scVal.u64(job.id),
          scVal.bytes32(deliverableHash),
        ],
        setTransactionStage,
      );
      recordWalletTransaction(signer.address, result.hash, "deliver_job");
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: "Delivered",
                deliverableHash,
                txHash: result.hash,
              }
            : item,
        ),
      );
      pushActivity(
        "Deliverable submitted",
        `Job #${job.id} is ready for approval.`,
        "success",
        result.hash,
      );
      toast.success("Deliverable proof recorded");
      setDeliverOpen(false);
      await refreshProtocol();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delivery failed.";
      captureProductError(error, { flow: "deliver_job", jobId: job.id });
      pushActivity("Delivery failed", message, "error");
      toast.error("Could not submit delivery", { description: message });
    } finally {
      setBusy(null);
    }
  }

  function openApprove(job: Job) {
    setSelectedJob(job);
    setRating(5);
    resetTransaction();
    setApproveOpen(true);
  }

  async function handleApprove(event: FormEvent) {
    event.preventDefault();
    if (!selectedJob) return;
    const job = selectedJob;
    setBusy(`approve-${job.id}`);
    resetTransaction();
    try {
      const signer = requireWallet();
      if (!job.chainBacked) {
        throw new Error("Demo jobs cannot release real escrow.");
      }
      const result = await submitAgentRailCall(
        signer.address,
        "approve_job",
        [
          scVal.address(signer.address),
          scVal.u64(job.id),
          scVal.u32(rating),
        ],
        setTransactionStage,
      );
      recordWalletTransaction(signer.address, result.hash, "approve_job");
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: "Released",
                rating,
                txHash: result.hash,
              }
            : item,
        ),
      );
      setAgents((current) =>
        current.map((agent) =>
          agent.id === job.agentId
            ? {
                ...agent,
                completed: agent.completed + 1,
                rating:
                  (agent.rating * agent.completed + rating) /
                  (agent.completed + 1),
              }
            : agent,
        ),
      );
      pushActivity(
        "Payment released",
        `Job #${job.id} settled with a ${rating}-star rating.`,
        "success",
        result.hash,
      );
      toast.success("Payment released to agent");
      setApproveOpen(false);
      await refreshProtocol();
      window.setTimeout(() => setFeedbackOpen(true), 600);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approval failed.";
      captureProductError(error, { flow: "approve_job", jobId: job.id });
      pushActivity("Approval failed", message, "error");
      toast.error("Could not release payment", { description: message });
    } finally {
      setBusy(null);
    }
  }

  function selectAgent(agent: Agent, openJob = false) {
    setSelectedAgentId(agent.id);
    setJobAmount(decimalFromStroops(agent.priceStroops));
    trackEvent("agent_selected", { agentId: agent.id, handle: agent.handle });
    if (openJob) {
      if (!agent.chainBacked) {
        toast.error("Demo listing", {
          description: "Enable a live contract listing before funding escrow.",
        });
        return;
      }
      resetTransaction();
      setJobOpen(true);
    }
  }

  function closeOnboarding(open: boolean) {
    setOnboardingOpen(open);
    if (!open) window.localStorage.setItem("agentrail.onboarding.seen", "true");
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider delayDuration={200}>
        <AppShell
        wallet={wallet}
        connecting={busy === "wallet"}
        jobCount={jobs.length}
        onConnect={handleConnect}
        onOpenOnboarding={() => setOnboardingOpen(true)}
      >
        <div id="overview" className="scroll-mt-20">
          <DashboardOverview
            stats={stats}
            dataMode={dataMode}
            latestLedger={latestLedger}
            onRegisterAgent={() => {
              resetTransaction();
              setRegisterOpen(true);
            }}
            onCreateJob={() => {
              resetTransaction();
              setJobOpen(true);
            }}
          />
        </div>

        <section
          id="marketplace"
          className="mt-3 grid scroll-mt-20 gap-3 xl:grid-cols-[1.55fr_.45fr]"
        >
          <Marketplace
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelect={(agent) => selectAgent(agent)}
            onHire={(agent) => selectAgent(agent, true)}
          />
          <aside className="rounded-xl border border-white/[.08] bg-gradient-to-b from-emerald-400/[.055] to-transparent p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-400">
              Built for trust
            </p>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-100">
              Settlement without platform custody.
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Briefs and deliverables remain private while their SHA-256 proofs create an
              immutable audit trail on Stellar.
            </p>
            <div className="mt-4 rounded-lg border border-white/[.06] bg-slate-950/40 p-3 text-[10px] text-slate-500">
              {dataMode === "loading" && "Loading verified contract state…"}
              {dataMode === "live" &&
                `Live contract state · ledger ${latestLedger ?? "—"}`}
              {dataMode === "demo" && "Demo mode · transactions are disabled"}
              {dataMode === "error" &&
                "Contract state unavailable · check RPC configuration"}
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["Buyer-controlled release", "Funds move only after explicit approval."],
                ["Deadline recovery", "Expired, undelivered jobs can be refunded."],
                ["Portable reputation", "Ratings follow the agent, not a platform."],
              ].map(([title, copy], index) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-[10px] font-semibold text-emerald-300">
                    {index + 1}
                  </span>
                  <div>
                    <strong className="block text-xs text-slate-300">{title}</strong>
                    <span className="mt-0.5 block text-[10px] leading-4 text-slate-600">{copy}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <div id="jobs" className="mt-3 scroll-mt-20">
          <JobActivity
            jobs={jobs}
            agents={agents}
            events={activity}
            busy={busy}
            walletAddress={wallet?.address}
            onDeliver={openDeliver}
            onApprove={openApprove}
          />
        </div>

        <footer
          id="validation"
          className="mt-6 flex scroll-mt-20 flex-col gap-3 border-t border-white/[.06] py-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>AgentRail · Stellar Testnet · Non-custodial escrow protocol</span>
          <Button variant="ghost" size="sm" onClick={() => setFeedbackOpen(true)}>
            <MessageSquareText size={13} />
            Share feedback
          </Button>
        </footer>
        </AppShell>

      <RegisterAgentDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        value={registerForm}
        onChange={setRegisterForm}
        onSubmit={handleRegisterAgent}
        stage={transactionStage}
      />
      <CreateJobDialog
        open={jobOpen}
        onOpenChange={setJobOpen}
        agent={selectedAgent}
        brief={brief}
        amount={jobAmount}
        ledgers={deadlineLedgers}
        onBriefChange={setBrief}
        onAmountChange={setJobAmount}
        onLedgersChange={setDeadlineLedgers}
        onSubmit={handleCreateJob}
        stage={transactionStage}
      />
      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={closeOnboarding}
        walletConnected={Boolean(wallet)}
        onConnect={handleConnect}
      />
      <DeliverJobDialog
        open={deliverOpen}
        onOpenChange={setDeliverOpen}
        job={selectedJob}
        deliverable={deliverable}
        onDeliverableChange={setDeliverable}
        onSubmit={handleDeliver}
        stage={transactionStage}
      />
      <ApproveJobDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        job={selectedJob}
        rating={rating}
        onRatingChange={setRating}
        onSubmit={handleApprove}
        stage={transactionStage}
      />
      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        wallet={wallet?.address ?? ""}
      />
        <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,.1)",
            color: "#e2e8f0",
          },
        }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;

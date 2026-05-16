import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  Terminal,
  Wallet,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  checkFreighter,
  connectFreighter,
  decimalFromStroops,
  getLatestLedgerSequence,
  scVal,
  sha256Hex,
  stellarConfig,
  stroopsFromDecimal,
  submitAgentRailCall,
  type SubmitResult,
  type WalletState,
} from "./lib/stellar";

type Agent = {
  id: number;
  handle: string;
  name: string;
  endpoint: string;
  category: string;
  priceStroops: bigint;
  rating: number;
  completed: number;
  active: boolean;
  owner: string;
};

type JobStatus = "Funded" | "Delivered" | "Released" | "Refunded" | "Disputed";

type Job = {
  id: number;
  agentId: number;
  payer: string;
  amountStroops: bigint;
  status: JobStatus;
  brief: string;
  briefHash: string;
  deliverableHash?: string;
  rating?: number;
  txHash?: string;
};

type RegisterForm = {
  handle: string;
  name: string;
  endpoint: string;
  category: string;
  price: string;
};

type EventLine = {
  label: string;
  detail: string;
  hash?: string;
};

const sampleAgents: Agent[] = [
  {
    id: 1,
    handle: "vision-api",
    name: "Vision API Agent",
    endpoint: "https://api.agentrail.dev/vision",
    category: "Computer Vision",
    priceStroops: 250_000n,
    rating: 4.9,
    completed: 128,
    active: true,
    owner: "GAGENTVISIONDEMOADDRESS",
  },
  {
    id: 2,
    handle: "mrv-scout",
    name: "Carbon MRV Scout",
    endpoint: "https://api.agentrail.dev/mrv",
    category: "ReFi / RWA",
    priceStroops: 520_000n,
    rating: 4.8,
    completed: 64,
    active: true,
    owner: "GAGENTMRVDEMOADDRESS",
  },
  {
    id: 3,
    handle: "rights-oracle",
    name: "Creator Rights Oracle",
    endpoint: "https://api.agentrail.dev/rights",
    category: "Identity",
    priceStroops: 390_000n,
    rating: 4.7,
    completed: 91,
    active: true,
    owner: "GAGENTRIGHTSDEMOADDRESS",
  },
];

const sampleJobs: Job[] = [
  {
    id: 1,
    agentId: 2,
    payer: "Rise In demo buyer",
    amountStroops: 520_000n,
    status: "Delivered",
    brief:
      "Verify invoice, satellite timestamp, and farm cooperative attestation.",
    briefHash:
      "7a2a5c2f2bcdf8f8dcbd8ad5e99a1973b8d70fb81ce2f184bc7f9fc091f4f9cd",
    deliverableHash:
      "d2ad8f1a9a4027ea57f3ea88f813587cbd1c71e42087af52d92a44bc4a41e924",
  },
];

const initialForm: RegisterForm = {
  handle: "istanbul-agent",
  name: "Istanbul Data Scout",
  endpoint: "https://api.agentrail.dev/istanbul",
  category: "Local Finance",
  price: "0.041",
};

function short(value: string, size = 6) {
  if (!value) return "";
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

function statusClass(status: JobStatus) {
  return `status ${status.toLowerCase()}`;
}

function RailMap({ jobs }: { jobs: Job[] }) {
  const released = jobs.filter((job) => job.status === "Released").length;
  const active = jobs.filter(
    (job) => job.status === "Funded" || job.status === "Delivered",
  ).length;

  return (
    <section className="rail-map" aria-label="AgentRail flow">
      <div className="rail-line" />
      <div className="rail-node buyer">
        <Wallet size={18} />
        <span>Buyer</span>
      </div>
      <div className="rail-node escrow">
        <LockKeyhole size={18} />
        <span>Escrow</span>
      </div>
      <div className="rail-node agent">
        <Bot size={18} />
        <span>Agent</span>
      </div>
      <div className="rail-pulse one" />
      <div className="rail-pulse two" />
      <div className="rail-stat left">
        <strong>{active}</strong>
        <span>open</span>
      </div>
      <div className="rail-stat right">
        <strong>{released}</strong>
        <span>paid</span>
      </div>
    </section>
  );
}

function App() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [agents, setAgents] = useState<Agent[]>(sampleAgents);
  const [jobs, setJobs] = useState<Job[]>(sampleJobs);
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialForm);
  const [brief, setBrief] = useState(
    "Summarize paid API response quality and return JSON evidence.",
  );
  const [jobAmount, setJobAmount] = useState("0.025");
  const [deadlineLedgers, setDeadlineLedgers] = useState("1200");
  const [busy, setBusy] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<EventLine[]>([
    {
      label: "Contract tests",
      detail: "5 Soroban escrow tests passing locally",
    },
  ]);

  useEffect(() => {
    checkFreighter().then(setWallet);
  }, []);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const canUseLiveContract = Boolean(wallet && stellarConfig.contractId);

  const stats = useMemo(() => {
    const locked = jobs
      .filter((job) => job.status === "Funded" || job.status === "Delivered")
      .reduce((total, job) => total + job.amountStroops, 0n);
    const released = jobs
      .filter((job) => job.status === "Released")
      .reduce((total, job) => total + job.amountStroops, 0n);

    return {
      agents: agents.length,
      jobs: jobs.length,
      locked,
      released,
    };
  }, [agents, jobs]);

  function pushEvent(line: EventLine) {
    setEventLog((current) => [line, ...current].slice(0, 6));
  }

  async function handleConnect() {
    setBusy("wallet");
    try {
      setWallet(await connectFreighter());
      pushEvent({ label: "Wallet", detail: "Freighter connected" });
    } catch (error) {
      pushEvent({
        label: "Wallet error",
        detail: error instanceof Error ? error.message : "Connection failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleRegisterAgent(event: FormEvent) {
    event.preventDefault();
    setBusy("register");

    try {
      const priceStroops = stroopsFromDecimal(registerForm.price);
      let liveResult: SubmitResult | null = null;

      if (canUseLiveContract && wallet) {
        liveResult = await submitAgentRailCall(wallet.address, "register_agent", [
          scVal.address(wallet.address),
          scVal.string(registerForm.handle),
          scVal.string(registerForm.name),
          scVal.string(registerForm.endpoint),
          scVal.string(registerForm.category),
          scVal.i128(priceStroops),
        ]);
      }

      const nextId = Math.max(...agents.map((agent) => agent.id)) + 1;
      setAgents((current) => [
        {
          id: nextId,
          ...registerForm,
          priceStroops,
          rating: 5,
          completed: 0,
          active: true,
          owner: wallet?.address ?? "Demo owner",
        },
        ...current,
      ]);
      setSelectedAgentId(nextId);
      pushEvent({
        label: liveResult ? "Agent registered on Testnet" : "Agent staged",
        detail: `${registerForm.handle} at ${decimalFromStroops(priceStroops)} XLM`,
        hash: liveResult?.hash,
      });
    } catch (error) {
      pushEvent({
        label: "Register error",
        detail: error instanceof Error ? error.message : "Registration failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleFundJob(event: FormEvent) {
    event.preventDefault();
    if (!selectedAgent) return;
    setBusy("fund");

    try {
      const amount = stroopsFromDecimal(jobAmount);
      const briefHash = await sha256Hex(
        `${selectedAgent.handle}:${brief}:${Date.now()}`,
      );
      let liveResult: SubmitResult | null = null;

      if (canUseLiveContract && wallet) {
        const currentLedger = await getLatestLedgerSequence();
        liveResult = await submitAgentRailCall(wallet.address, "create_job", [
          scVal.address(wallet.address),
          scVal.u64(selectedAgent.id),
          scVal.bytes32(briefHash),
          scVal.i128(amount),
          scVal.u32(currentLedger + Number(deadlineLedgers)),
        ]);
      }

      const nextId = Math.max(0, ...jobs.map((job) => job.id)) + 1;
      setJobs((current) => [
        {
          id: nextId,
          agentId: selectedAgent.id,
          payer: wallet?.address ?? "Demo buyer",
          amountStroops: amount,
          status: "Funded",
          brief,
          briefHash,
          txHash: liveResult?.hash,
        },
        ...current,
      ]);
      pushEvent({
        label: liveResult ? "Escrow funded on Testnet" : "Escrow funded",
        detail: `${selectedAgent.handle} receives ${decimalFromStroops(amount)} XLM after approval`,
        hash: liveResult?.hash,
      });
    } catch (error) {
      pushEvent({
        label: "Funding error",
        detail: error instanceof Error ? error.message : "Funding failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function deliverJob(jobId: number) {
    const deliverableHash = await sha256Hex(`deliverable:${jobId}:${Date.now()}`);
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, status: "Delivered", deliverableHash } : job,
      ),
    );
    pushEvent({
      label: "Deliverable hash stored",
      detail: `Job #${jobId} is ready for buyer approval`,
    });
  }

  function approveJob(jobId: number) {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, status: "Released", rating: 5 } : job,
      ),
    );
    setAgents((current) =>
      current.map((agent) => {
        const job = jobs.find((entry) => entry.id === jobId);
        if (!job || agent.id !== job.agentId) return agent;
        return {
          ...agent,
          completed: agent.completed + 1,
          rating: Math.min(5, (agent.rating * agent.completed + 5) / (agent.completed + 1)),
        };
      }),
    );
    pushEvent({
      label: "Escrow released",
      detail: `Job #${jobId} closed with a 5 star rating`,
    });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <img src="/agentrail-mark.svg" alt="" className="brand-mark" />
          <div>
            <h1>AgentRail</h1>
            <span>Stellar Testnet</span>
          </div>
        </div>
        <div className="top-actions">
          <div className={stellarConfig.contractId ? "pill ok" : "pill warn"}>
            <Activity size={15} />
            {stellarConfig.contractId ? "Live contract" : "Demo + local contract"}
          </div>
          <button className="primary-button" onClick={handleConnect}>
            {busy === "wallet" ? <Loader2 className="spin" size={18} /> : <Wallet size={18} />}
            {wallet ? short(wallet.address, 5) : "Connect Freighter"}
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="workspace-panel intro-panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Agent payment rail</span>
              <h2>Verified services, escrowed payouts, reputation that agents can carry.</h2>
            </div>
            <ShieldCheck size={30} />
          </div>
          <RailMap jobs={jobs} />
        </div>

        <div className="metric-grid">
          <div className="metric">
            <Bot size={18} />
            <strong>{stats.agents}</strong>
            <span>agents</span>
          </div>
          <div className="metric">
            <ClipboardCheck size={18} />
            <strong>{stats.jobs}</strong>
            <span>jobs</span>
          </div>
          <div className="metric">
            <LockKeyhole size={18} />
            <strong>{decimalFromStroops(stats.locked)}</strong>
            <span>XLM locked</span>
          </div>
          <div className="metric">
            <CircleDollarSign size={18} />
            <strong>{decimalFromStroops(stats.released)}</strong>
            <span>XLM released</span>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <aside className="workspace-panel control-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Registry</span>
              <h2>Register agent</h2>
            </div>
            <Plus size={22} />
          </div>
          <form className="form-stack" onSubmit={handleRegisterAgent}>
            <label>
              <span>Handle</span>
              <input
                value={registerForm.handle}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, handle: event.target.value })
                }
              />
            </label>
            <label>
              <span>Name</span>
              <input
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, name: event.target.value })
                }
              />
            </label>
            <label>
              <span>Endpoint</span>
              <input
                value={registerForm.endpoint}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, endpoint: event.target.value })
                }
              />
            </label>
            <div className="form-row">
              <label>
                <span>Category</span>
                <input
                  value={registerForm.category}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      category: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>XLM</span>
                <input
                  inputMode="decimal"
                  value={registerForm.price}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, price: event.target.value })
                  }
                />
              </label>
            </div>
            <button className="primary-button wide" disabled={busy === "register"}>
              {busy === "register" ? <Loader2 className="spin" size={18} /> : <Bot size={18} />}
              Register
            </button>
          </form>

          <div className="config-list">
            <div>
              <span>Contract</span>
              <strong>{stellarConfig.contractId ? short(stellarConfig.contractId, 7) : "not set"}</strong>
            </div>
            <div>
              <span>Token</span>
              <strong>{short(stellarConfig.nativeTokenContractId, 7)}</strong>
            </div>
          </div>
        </aside>

        <section className="workspace-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h2>Agents</h2>
            </div>
            <RefreshCw size={22} />
          </div>
          <div className="agent-list">
            {agents.map((agent) => (
              <button
                className={
                  selectedAgentId === agent.id ? "agent-card selected" : "agent-card"
                }
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setJobAmount(decimalFromStroops(agent.priceStroops));
                }}
              >
                <div className="agent-card-head">
                  <div className="icon-tile">
                    <Bot size={20} />
                  </div>
                  <div>
                    <strong>{agent.name}</strong>
                    <span>@{agent.handle}</span>
                  </div>
                </div>
                <p>{agent.endpoint}</p>
                <div className="agent-meta">
                  <span>{agent.category}</span>
                  <span>
                    <Star size={14} />
                    {agent.rating.toFixed(1)}
                  </span>
                  <span>{decimalFromStroops(agent.priceStroops)} XLM</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Escrow</span>
              <h2>Create job</h2>
            </div>
            <LockKeyhole size={22} />
          </div>
          <form className="form-stack" onSubmit={handleFundJob}>
            <label>
              <span>Agent</span>
              <select
                value={selectedAgentId}
                onChange={(event) => {
                  const id = Number(event.target.value);
                  const agent = agents.find((entry) => entry.id === id);
                  setSelectedAgentId(id);
                  if (agent) setJobAmount(decimalFromStroops(agent.priceStroops));
                }}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Brief</span>
              <textarea
                rows={5}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
              />
            </label>
            <div className="form-row">
              <label>
                <span>XLM</span>
                <input
                  inputMode="decimal"
                  value={jobAmount}
                  onChange={(event) => setJobAmount(event.target.value)}
                />
              </label>
              <label>
                <span>Ledgers</span>
                <input
                  inputMode="numeric"
                  value={deadlineLedgers}
                  onChange={(event) => setDeadlineLedgers(event.target.value)}
                />
              </label>
            </div>
            <button className="primary-button wide" disabled={busy === "fund"}>
              {busy === "fund" ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <CircleDollarSign size={18} />
              )}
              Fund escrow
            </button>
          </form>
        </section>
      </section>

      <section className="lower-grid">
        <div className="workspace-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Work queue</span>
              <h2>Jobs</h2>
            </div>
            <Clock3 size={22} />
          </div>
          <div className="job-list">
            {jobs.map((job) => {
              const agent = agents.find((entry) => entry.id === job.agentId);
              return (
                <article className="job-card" key={job.id}>
                  <div className="job-top">
                    <div>
                      <strong>#{job.id} {agent?.handle}</strong>
                      <span>{short(job.briefHash, 10)}</span>
                    </div>
                    <span className={statusClass(job.status)}>{job.status}</span>
                  </div>
                  <p>{job.brief}</p>
                  <div className="job-actions">
                    <span>{decimalFromStroops(job.amountStroops)} XLM</span>
                    {job.status === "Funded" && (
                      <button onClick={() => deliverJob(job.id)}>
                        <ArrowRight size={16} />
                        Deliver
                      </button>
                    )}
                    {job.status === "Delivered" && (
                      <button onClick={() => approveJob(job.id)}>
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                    )}
                    {job.txHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${job.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={16} />
                        Explorer
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="workspace-panel">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Run log</span>
              <h2>Activity</h2>
            </div>
            <Terminal size={22} />
          </div>
          <div className="event-list">
            {eventLog.map((line, index) => (
              <div className="event-line" key={`${line.label}-${index}`}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>{line.label}</strong>
                  <span>{line.detail}</span>
                  {line.hash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${line.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {short(line.hash, 12)}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;

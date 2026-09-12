export type Agent = {
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
  responseTime: string;
  successRate: number;
  verified?: boolean;
  chainBacked: boolean;
};

export type JobStatus =
  | "Funded"
  | "Delivered"
  | "Released"
  | "Refunded"
  | "Disputed";

export type Job = {
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
  createdAt: string;
  agentOwner?: string;
  deadlineLedger?: number;
  createdLedger?: number;
  deliveredLedger?: number;
  closedLedger?: number;
  chainBacked: boolean;
  assetCode?: string;
  assetContract?: string;
};

export type MilestoneStatus = "Funded" | "Delivered" | "Released" | "Refunded";

export type Milestone = {
  index: number;
  briefHash: string;
  deliverableHash?: string;
  amountStroops: bigint;
  deadlineLedger: number;
  status: MilestoneStatus;
  deliveredLedger?: number;
  closedLedger?: number;
};

export type MilestonePlan = {
  jobId: number;
  currentIndex: number;
  releasedAmountStroops: bigint;
  milestones: Milestone[];
  chainBacked: boolean;
};

export type MilestoneDraft = {
  title: string;
  amount: string;
  ledgerOffset: string;
};

export type SettlementAsset = {
  token: string;
  code: string;
  decimals: number;
  enabled: boolean;
};

export type ProtocolGovernance = {
  paused: boolean;
  version: number;
  minUpgradeDelayLedgers: number;
  upgradePending: boolean;
  upgradeWasmHash?: string;
  upgradeExecuteAfterLedger?: number;
};

export type ContractEvent = {
  id: string;
  family: string;
  action: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  detail: string;
};

export type ProtocolSnapshot = {
  agents: Agent[];
  jobs: Job[];
  milestonePlans: MilestonePlan[];
  settlementAssets: SettlementAsset[];
  governance: ProtocolGovernance;
  contractEvents: ContractEvent[];
  ledger: number;
  loadedAt: string;
};

export type RegisterForm = {
  handle: string;
  name: string;
  endpoint: string;
  category: string;
  price: string;
};

export type ActivityEvent = {
  id: string;
  label: string;
  detail: string;
  hash?: string;
  tone?: "success" | "warning" | "error" | "neutral";
  at: string;
};

export type TransactionStage =
  | "idle"
  | "preparing"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export type WalletEvidence = {
  address: string;
  connectedAt: string;
  transactions: Array<{
    hash: string;
    action: string;
    at: string;
  }>;
  feedbackSubmitted: boolean;
};

export type Feedback = {
  id: string;
  wallet: string;
  score: number;
  role: "buyer" | "agent" | "explorer";
  message: string;
  createdAt: string;
};

export type GrowthRole = "buyer" | "agent" | "explorer";

export type GrowthMission =
  | "register_agent"
  | "create_job"
  | "deliver_job"
  | "approve_job"
  | "explore_contract";

export type VerifiedTestnetProof = {
  hash: string;
  wallet: string;
  sourceAccount: string;
  ledger: number;
  createdAt: string;
  verifiedAt: string;
  operationCount: number;
  contractInteraction: boolean;
  walletMatches: boolean;
  functionName?: string;
  explorerUrl: string;
  role: GrowthRole;
  mission: GrowthMission;
};

export type GrowthProfile = {
  role: GrowthRole;
  mission: GrowthMission;
  referralCode: string;
  referredBy?: string;
  startedAt: string;
  lastSeenAt: string;
  visits: number;
};

import * as StellarSdk from "@stellar/stellar-sdk";
import {
  getAddress,
  getNetwork,
  isConnected,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";
import type { TransactionStage } from "@/types/agentrail";
import type {
  Agent,
  ContractEvent,
  Job,
  JobStatus,
  MilestoneDraft,
  MilestonePlan,
  MilestoneStatus,
  ProtocolSnapshot,
  ProtocolGovernance,
  SettlementAsset,
} from "@/types/agentrail";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const DEPLOYED_TESTNET_CONTRACT =
  "CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5";
const DEPLOYED_TESTNET_READ_SOURCE =
  "GBRTZ4TDJDBMR3Y3S3IAFEQFFW2YGRR35XOPRMHGFRKFGY4PMOU45T3N";

const INVALID_PUBLIC_ENV_VALUE = /^(?:\[?sensitive\]?|undefined|null|changeme)$/i;

export function resolvePublicEnvValue(
  value: string | undefined,
  fallback: string,
  isValid: (candidate: string) => boolean = () => true,
): string {
  const candidate = value?.trim() ?? "";
  if (!candidate || INVALID_PUBLIC_ENV_VALUE.test(candidate) || !isValid(candidate)) {
    return fallback;
  }
  return candidate;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const stellarConfig = {
  contractId: resolvePublicEnvValue(
    import.meta.env.VITE_AGENTRAIL_CONTRACT_ID,
    DEPLOYED_TESTNET_CONTRACT,
    StellarSdk.StrKey.isValidContract,
  ),
  rpcUrl: resolvePublicEnvValue(
    import.meta.env.VITE_STELLAR_RPC_URL,
    "https://soroban-testnet.stellar.org",
    isHttpUrl,
  ),
  networkPassphrase: resolvePublicEnvValue(
    import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE,
    TESTNET_PASSPHRASE,
    (value) => value === TESTNET_PASSPHRASE,
  ),
  nativeTokenContractId: resolvePublicEnvValue(
    import.meta.env.VITE_NATIVE_TOKEN_CONTRACT_ID,
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    StellarSdk.StrKey.isValidContract,
  ),
  readSource: resolvePublicEnvValue(
    import.meta.env.VITE_AGENTRAIL_READ_SOURCE,
    DEPLOYED_TESTNET_READ_SOURCE,
    StellarSdk.StrKey.isValidEd25519PublicKey,
  ),
  network: "TESTNET",
  networkLabel: "Testnet",
  explorerBaseUrl: "https://stellar.expert/explorer/testnet",
  demoMode: import.meta.env.VITE_ENABLE_DEMO_MODE === "true",
};

export const agentRailContractExplorerUrl =
  `${stellarConfig.explorerBaseUrl}/contract/${stellarConfig.contractId}`;

export type WalletState = {
  address: string;
  network: string;
  networkPassphrase: string;
};

export type SubmitResult = {
  hash: string;
  status: string;
  explorerUrl: string;
  returnValue?: unknown;
};

type FreighterBoolean = boolean | { isConnected?: boolean; isAllowed?: boolean };
type FreighterAddress = string | { address?: string; publicKey?: string };
type FreighterNetwork = {
  network?: string;
  networkPassphrase?: string;
  error?: unknown;
};

function unpackBoolean(result: FreighterBoolean): boolean {
  if (typeof result === "boolean") return result;
  return Boolean(result.isConnected ?? result.isAllowed);
}

function unpackAddress(result: FreighterAddress): string {
  if (typeof result === "string") return result;
  const value = result.address ?? result.publicKey;
  if (!value) throw new Error("Freighter did not return a public key.");
  return value;
}

export async function connectFreighter(): Promise<WalletState> {
  const connected = unpackBoolean((await isConnected()) as FreighterBoolean);
  if (!connected) {
    throw new Error("Freighter extension is not available.");
  }

  const permission = await setAllowed();
  if ("error" in permission && permission.error) {
    throw new Error("Freighter permission was not granted.");
  }
  const address = unpackAddress((await getAddress()) as FreighterAddress);
  const network = (await getNetwork()) as FreighterNetwork;
  validateWalletNetwork(network);
  return {
    address,
    network: network.network ?? "TESTNET",
    networkPassphrase: network.networkPassphrase ?? TESTNET_PASSPHRASE,
  };
}

export async function checkFreighter(): Promise<WalletState | null> {
  try {
    const connected = unpackBoolean((await isConnected()) as FreighterBoolean);
    if (!connected) return null;
    const address = unpackAddress((await getAddress()) as FreighterAddress);
    const network = (await getNetwork()) as FreighterNetwork;
    if (!network.networkPassphrase) return null;
    return {
      address,
      network: network.network ?? "TESTNET",
      networkPassphrase: network.networkPassphrase,
    };
  } catch {
    return null;
  }
}

function validateWalletNetwork(network: FreighterNetwork) {
  if (network.error) {
    throw new Error("Freighter network could not be read.");
  }
  const walletPassphrase = network.networkPassphrase?.trim();
  const walletNetwork = network.network?.trim().toUpperCase();
  const valid = walletPassphrase
    ? walletPassphrase === stellarConfig.networkPassphrase
    : walletNetwork === stellarConfig.network;
  if (!valid) {
    throw new Error(
      `Switch Freighter to Stellar Testnet before signing. Current network: ${
        network.network ?? "unknown"
      }.`,
    );
  }
}

export async function assertFreighterNetwork() {
  const network = (await getNetwork()) as FreighterNetwork;
  validateWalletNetwork(network);
}

export function walletMatchesConfiguredNetwork(wallet: WalletState): boolean {
  return wallet.networkPassphrase.trim() === stellarConfig.networkPassphrase;
}

export function stroopsFromDecimal(input: string): bigint {
  const normalized = input.trim();
  if (!/^\d+(\.\d{0,7})?$/.test(normalized)) {
    throw new Error("Amount must use up to 7 decimal places.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const padded = `${fraction}0000000`.slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(padded);
}

export function decimalFromStroops(amount: bigint | number | string): string {
  const value = BigInt(amount);
  const whole = value / 10_000_000n;
  const fraction = (value % 10_000_000n).toString().padStart(7, "0");
  return `${whole}.${fraction.replace(/0+$/, "") || "0"}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  if (clean.length !== 64) {
    throw new Error("Expected a 32-byte hex string.");
  }

  const bytes = new Uint8Array(32);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export const scVal = {
  address(value: string) {
    return StellarSdk.Address.fromString(value).toScVal();
  },
  string(value: string) {
    return StellarSdk.nativeToScVal(value, { type: "string" });
  },
  i128(value: bigint | number | string) {
    return StellarSdk.nativeToScVal(BigInt(value), { type: "i128" });
  },
  u64(value: bigint | number | string) {
    return StellarSdk.nativeToScVal(BigInt(value), { type: "u64" });
  },
  u32(value: number) {
    return StellarSdk.nativeToScVal(value, { type: "u32" });
  },
  bytes32(hex: string) {
    return StellarSdk.nativeToScVal(hexToBytes(hex), { type: "bytes" });
  },
  milestoneInputs(
    milestones: Array<MilestoneDraft & { briefHash: string; deadlineLedger: number }>,
  ) {
    const symbol = (value: string) =>
      StellarSdk.nativeToScVal(value, { type: "symbol" });
    const entry = (key: string, val: StellarSdk.xdr.ScVal) =>
      new StellarSdk.xdr.ScMapEntry({ key: symbol(key), val });
    return StellarSdk.xdr.ScVal.scvVec(
      milestones.map((milestone) =>
        StellarSdk.xdr.ScVal.scvMap([
          entry("amount", StellarSdk.nativeToScVal(stroopsFromDecimal(milestone.amount), { type: "i128" })),
          entry("brief_hash", StellarSdk.nativeToScVal(hexToBytes(milestone.briefHash), { type: "bytes" })),
          entry("deadline_ledger", StellarSdk.nativeToScVal(milestone.deadlineLedger, { type: "u32" })),
        ]),
      ),
    );
  },
};

export async function getLatestLedgerSequence(): Promise<number> {
  const server = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);
  const latest = await server.getLatestLedger();
  return latest.sequence;
}

type HorizonTransaction = {
  hash: string;
  successful: boolean;
  ledger: number;
  created_at: string;
  source_account: string;
  operation_count: number;
};

type HorizonOperation = {
  type: string;
  source_account?: string;
  function?: string;
  parameters?: Array<{ type: string; value: string }>;
};

type HorizonOperationsPage = {
  _embedded?: { records?: HorizonOperation[] };
};

export type TestnetTransactionVerification = {
  hash: string;
  sourceAccount: string;
  ledger: number;
  createdAt: string;
  operationCount: number;
  contractInteraction: boolean;
  walletMatches: boolean;
  functionName?: string;
  explorerUrl: string;
};

function decodeContractFunction(operation: HorizonOperation): string | undefined {
  const encoded = operation.parameters?.[1]?.value;
  if (!encoded) return undefined;
  try {
    const value = StellarSdk.scValToNative(
      StellarSdk.xdr.ScVal.fromXDR(encoded, "base64"),
    );
    return typeof value === "string" ? value : String(value);
  } catch {
    return undefined;
  }
}

export async function verifyAgentRailTestnetTransaction(
  rawHash: string,
  expectedWallet?: string,
): Promise<TestnetTransactionVerification> {
  const hash = rawHash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error("Enter a 64-character Stellar transaction hash.");
  }
  if (
    expectedWallet &&
    !StellarSdk.StrKey.isValidEd25519PublicKey(expectedWallet)
  ) {
    throw new Error("The participant wallet address is not a valid Stellar public key.");
  }

  const transactionUrl = `https://horizon-testnet.stellar.org/transactions/${hash}`;
  const operationsUrl = `${transactionUrl}/operations?limit=20`;
  const [transactionResponse, operationsResponse] = await Promise.all([
    fetch(transactionUrl, { headers: { Accept: "application/json" } }),
    fetch(operationsUrl, { headers: { Accept: "application/json" } }),
  ]);

  if (transactionResponse.status === 404) {
    throw new Error("Transaction was not found on Stellar Testnet.");
  }
  if (!transactionResponse.ok || !operationsResponse.ok) {
    throw new Error("Stellar Testnet proof service is temporarily unavailable.");
  }

  const transaction = (await transactionResponse.json()) as HorizonTransaction;
  const operationsPage = (await operationsResponse.json()) as HorizonOperationsPage;
  if (!transaction.successful) {
    throw new Error("The transaction exists but did not succeed.");
  }

  const contractAddressXdr = StellarSdk.Address.fromString(
    stellarConfig.contractId,
  )
    .toScVal()
    .toXDR("base64");
  const operations = operationsPage._embedded?.records ?? [];
  const contractOperation = operations.find(
    (operation) =>
      operation.type === "invoke_host_function" &&
      operation.parameters?.[0]?.value === contractAddressXdr,
  );
  const walletMatches = expectedWallet
    ? transaction.source_account === expectedWallet ||
      operations.some((operation) => operation.source_account === expectedWallet)
    : true;

  return {
    hash: transaction.hash,
    sourceAccount: transaction.source_account,
    ledger: transaction.ledger,
    createdAt: transaction.created_at,
    operationCount: transaction.operation_count,
    contractInteraction: Boolean(contractOperation),
    walletMatches,
    functionName: contractOperation
      ? decodeContractFunction(contractOperation)
      : undefined,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${transaction.hash}`,
  };
}

type NativeAgent = {
  id: bigint | number;
  owner: unknown;
  handle: string;
  name: string;
  endpoint: string;
  category: string;
  price: bigint | number | string;
  active: boolean;
  jobs_completed: number;
  rating_total: number;
  rating_count: number;
};

type NativeJob = {
  id: bigint | number;
  agent_id: bigint | number;
  payer: unknown;
  agent_owner: unknown;
  brief_hash: unknown;
  deliverable_hash: unknown;
  amount: bigint | number | string;
  deadline_ledger: number;
  status: number;
  rating: number;
  created_ledger: number;
  delivered_ledger: number;
  closed_ledger: number;
};

type NativeMilestone = {
  index: number;
  brief_hash: unknown;
  deliverable_hash: unknown;
  amount: bigint | number | string;
  deadline_ledger: number;
  status: number;
  delivered_ledger: number;
  closed_ledger: number;
};

type NativeMilestonePlan = {
  job_id: bigint | number;
  current_index: number;
  released_amount: bigint | number | string;
  milestones: NativeMilestone[];
};

type NativeSettlementAsset = {
  token: unknown;
  code: string;
  decimals: number;
  enabled: boolean;
};

type NativeJobSettlement = {
  job_id: bigint | number;
  token: unknown;
};

type NativeGovernance = {
  paused: boolean;
  version: number;
  min_upgrade_delay_ledgers: number;
  upgrade_pending: boolean;
  upgrade_wasm_hash: unknown;
  upgrade_execute_after_ledger: number;
};

const JOB_STATUS: JobStatus[] = [
  "Funded",
  "Delivered",
  "Released",
  "Refunded",
  "Disputed",
];

const MILESTONE_STATUS: MilestoneStatus[] = [
  "Funded",
  "Delivered",
  "Released",
  "Refunded",
];

function addressToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return "";
}

function bytesToHex(value: unknown): string {
  if (typeof value === "string") return value.replace(/^0x/, "");
  if (value instanceof Uint8Array) {
    return [...value]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return "";
}

async function readAgentRailCall<T>(
  functionName: string,
  args: StellarSdk.xdr.ScVal[] = [],
): Promise<T> {
  if (!stellarConfig.contractId || !stellarConfig.readSource) {
    throw new Error("AgentRail read configuration is incomplete.");
  }

  const server = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);
  const account = await server.getAccount(stellarConfig.readSource);
  const contract = new StellarSdk.Contract(stellarConfig.contractId);
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();
  const simulation = await server.simulateTransaction(transaction);

  if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Contract read failed: ${simulation.error}`);
  }
  if (!simulation.result) {
    throw new Error(`Contract read returned no result for ${functionName}.`);
  }
  return StellarSdk.scValToNative(simulation.result.retval) as T;
}

function eventValueLabel(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" || typeof value === "number") return String(value);
  try {
    return JSON.stringify(value, (_, item) =>
      typeof item === "bigint" ? item.toString() : item,
    );
  } catch {
    return "Contract state transition";
  }
}

export async function loadContractEvents(
  latestLedger: number,
): Promise<ContractEvent[]> {
  const server = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);
  const response = await server.getEvents({
    startLedger: Math.max(1, latestLedger - 17_280),
    filters: [{ type: "contract", contractIds: [stellarConfig.contractId] }],
    limit: 50,
  });

  const observed = new Set<string>();
  return response.events
    .filter((event) => {
      if (observed.has(event.id)) return false;
      observed.add(event.id);
      return true;
    })
    .map((event) => {
      const topics = event.topic.map((topic) =>
        eventValueLabel(StellarSdk.scValToNative(topic)),
      );
      return {
        id: event.id,
        family: topics[0] ?? "contract",
        action: topics[1] ?? "event",
        ledger: event.ledger,
        ledgerClosedAt: event.ledgerClosedAt,
        txHash: event.txHash,
        detail: eventValueLabel(StellarSdk.scValToNative(event.value)),
      };
    })
    .reverse();
}

export async function loadProtocolSnapshot(): Promise<ProtocolSnapshot> {
  const [
    nativeAgents,
    nativeJobs,
    nativeMilestonePlans,
    nativeAssets,
    nativeSettlements,
    nativeGovernance,
    ledger,
  ] = await Promise.all([
    readAgentRailCall<NativeAgent[]>("list_agents"),
    readAgentRailCall<NativeJob[]>("list_jobs"),
    readAgentRailCall<NativeMilestonePlan[]>("list_milestone_plans").catch(() => []),
    readAgentRailCall<NativeSettlementAsset[]>("list_assets").catch(() => [
      {
        token: stellarConfig.nativeTokenContractId,
        code: "XLM",
        decimals: 7,
        enabled: true,
      },
    ]),
    readAgentRailCall<NativeJobSettlement[]>("list_job_settlements").catch(() => []),
    readAgentRailCall<NativeGovernance>("governance").catch(() => ({
      paused: false,
      version: 3,
      min_upgrade_delay_ledgers: 0,
      upgrade_pending: false,
      upgrade_wasm_hash: new Uint8Array(32),
      upgrade_execute_after_ledger: 0,
    })),
    getLatestLedgerSequence(),
  ]);

  const settlementAssets: SettlementAsset[] = nativeAssets.map((asset) => ({
    token: addressToString(asset.token),
    code: asset.code,
    decimals: Number(asset.decimals),
    enabled: asset.enabled,
  }));
  const assetByToken = new Map(settlementAssets.map((asset) => [asset.token, asset]));
  const tokenByJob = new Map(
    nativeSettlements.map((settlement) => [
      Number(settlement.job_id),
      addressToString(settlement.token),
    ]),
  );

  const agents: Agent[] = nativeAgents.map((agent) => {
    const ratingCount = Number(agent.rating_count);
    return {
      id: Number(agent.id),
      owner: addressToString(agent.owner),
      handle: agent.handle,
      name: agent.name,
      endpoint: agent.endpoint,
      category: agent.category,
      priceStroops: BigInt(agent.price),
      active: agent.active,
      completed: Number(agent.jobs_completed),
      rating:
        ratingCount > 0 ? Number(agent.rating_total) / ratingCount : 0,
      responseTime: "On-chain",
      successRate: 0,
      verified: true,
      chainBacked: true,
    };
  });

  const jobs: Job[] = nativeJobs.map((job) => {
    const briefHash = bytesToHex(job.brief_hash);
    const status = JOB_STATUS[Number(job.status)] ?? "Disputed";
    const assetContract =
      tokenByJob.get(Number(job.id)) ?? settlementAssets[0]?.token;
    return {
      id: Number(job.id),
      agentId: Number(job.agent_id),
      payer: addressToString(job.payer),
      agentOwner: addressToString(job.agent_owner),
      amountStroops: BigInt(job.amount),
      status,
      brief: `Private brief · proof ${briefHash.slice(0, 12)}…`,
      briefHash,
      deliverableHash: bytesToHex(job.deliverable_hash),
      rating: Number(job.rating) || undefined,
      createdAt: "",
      deadlineLedger: Number(job.deadline_ledger),
      createdLedger: Number(job.created_ledger),
      deliveredLedger: Number(job.delivered_ledger),
      closedLedger: Number(job.closed_ledger),
      chainBacked: true,
      assetCode: assetByToken.get(assetContract ?? "")?.code ?? "XLM",
      assetContract,
    };
  });

  const milestonePlans: MilestonePlan[] = nativeMilestonePlans.map((plan) => ({
    jobId: Number(plan.job_id),
    currentIndex: Number(plan.current_index),
    releasedAmountStroops: BigInt(plan.released_amount),
    chainBacked: true,
    milestones: plan.milestones.map((milestone) => ({
      index: Number(milestone.index),
      briefHash: bytesToHex(milestone.brief_hash),
      deliverableHash: bytesToHex(milestone.deliverable_hash) || undefined,
      amountStroops: BigInt(milestone.amount),
      deadlineLedger: Number(milestone.deadline_ledger),
      status: MILESTONE_STATUS[Number(milestone.status)] ?? "Funded",
      deliveredLedger: Number(milestone.delivered_ledger) || undefined,
      closedLedger: Number(milestone.closed_ledger) || undefined,
    })),
  }));

  const governance: ProtocolGovernance = {
    paused: nativeGovernance.paused,
    version: Number(nativeGovernance.version),
    minUpgradeDelayLedgers: Number(nativeGovernance.min_upgrade_delay_ledgers),
    upgradePending: nativeGovernance.upgrade_pending,
    upgradeWasmHash: nativeGovernance.upgrade_pending
      ? bytesToHex(nativeGovernance.upgrade_wasm_hash)
      : undefined,
    upgradeExecuteAfterLedger: nativeGovernance.upgrade_pending
      ? Number(nativeGovernance.upgrade_execute_after_ledger)
      : undefined,
  };
  const contractEvents = await loadContractEvents(ledger).catch(() => []);

  return {
    agents,
    jobs,
    milestonePlans,
    settlementAssets,
    governance,
    contractEvents,
    ledger,
    loadedAt: new Date().toISOString(),
  };
}

export async function submitAgentRailCall(
  source: string,
  functionName: string,
  args: StellarSdk.xdr.ScVal[],
  onStage?: (stage: TransactionStage) => void,
): Promise<SubmitResult> {
  if (!stellarConfig.contractId) {
    throw new Error("Missing VITE_AGENTRAIL_CONTRACT_ID.");
  }

  try {
    await assertFreighterNetwork();
    onStage?.("preparing");

    const server = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);
    const account = await server.getAccount(source);
    const contract = new StellarSdk.Contract(stellarConfig.contractId);
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: stellarConfig.networkPassphrase,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(180)
      .build();

    const prepared = await server.prepareTransaction(transaction);
    onStage?.("signing");
    const signed = await signTransaction(
      prepared.toEnvelope().toXDR("base64"),
      {
        networkPassphrase: stellarConfig.networkPassphrase,
        address: source,
      },
    );

    if ("error" in signed && signed.error) {
      throw new Error(signed.error);
    }

    onStage?.("submitting");
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signed.signedTxXdr,
      stellarConfig.networkPassphrase,
    ) as StellarSdk.Transaction;
    const submitted = await server.sendTransaction(signedTransaction);
    if (submitted.status !== "PENDING") {
      throw new Error(`RPC rejected transaction with status ${submitted.status}.`);
    }

    onStage?.("confirming");
    let confirmed = await server.getTransaction(submitted.hash);
    const confirmationDeadline = Date.now() + 60_000;
    while (confirmed.status === "NOT_FOUND" && Date.now() < confirmationDeadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      confirmed = await server.getTransaction(submitted.hash);
    }

    if (confirmed.status !== "SUCCESS") {
      if (confirmed.status === "NOT_FOUND") {
        throw new Error(
          `Confirmation timed out. Check transaction ${submitted.hash} in Stellar Expert.`,
        );
      }
      throw new Error(`Transaction failed with status ${confirmed.status}.`);
    }

    onStage?.("success");
    return {
      hash: submitted.hash,
      status: confirmed.status,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${submitted.hash}`,
      returnValue: confirmed.returnValue
        ? StellarSdk.scValToNative(confirmed.returnValue)
        : undefined,
    };
  } catch (error) {
    onStage?.("error");
    throw normalizeStellarError(error);
  }
}

function normalizeStellarError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("user declined") || lower.includes("rejected")) {
    return new Error("Signature request was cancelled. No transaction was submitted.");
  }
  if (lower.includes("account not found") || lower.includes("404")) {
    return new Error("This Testnet account is not funded yet. Fund it with Friendbot and retry.");
  }
  if (lower.includes("insufficient") || lower.includes("underfunded")) {
    return new Error("Insufficient Testnet XLM for this escrow and network fees.");
  }
  if (lower.includes("tx_bad_seq")) {
    return new Error("Wallet sequence changed. Please retry with a fresh transaction.");
  }
  return error instanceof Error ? error : new Error("Unexpected Stellar transaction error.");
}

import * as StellarSdk from "@stellar/stellar-sdk";
import {
  getAddress,
  getNetwork,
  isConnected,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";
import type { TransactionStage } from "@/types/agentrail";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const DEPLOYED_TESTNET_CONTRACT =
  "CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5";

export const stellarConfig = {
  contractId:
    import.meta.env.VITE_AGENTRAIL_CONTRACT_ID ?? DEPLOYED_TESTNET_CONTRACT,
  rpcUrl:
    import.meta.env.VITE_STELLAR_RPC_URL ??
    "https://soroban-testnet.stellar.org",
  networkPassphrase:
    import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE ?? TESTNET_PASSPHRASE,
  nativeTokenContractId:
    import.meta.env.VITE_NATIVE_TOKEN_CONTRACT_ID ??
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
};

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
  if (network.networkPassphrase !== stellarConfig.networkPassphrase) {
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
};

export async function getLatestLedgerSequence(): Promise<number> {
  const server = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);
  const latest = await server.getLatestLedger();
  return latest.sequence;
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

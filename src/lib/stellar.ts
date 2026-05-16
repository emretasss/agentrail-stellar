import * as StellarSdk from "@stellar/stellar-sdk";
import {
  getAddress,
  isConnected,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";

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
  network?: string;
};

export type SubmitResult = {
  hash: string;
  status: string;
  explorerUrl: string;
};

type FreighterBoolean = boolean | { isConnected?: boolean; isAllowed?: boolean };
type FreighterAddress = string | { address?: string; publicKey?: string };

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

  await setAllowed();
  const address = unpackAddress((await getAddress()) as FreighterAddress);
  return { address };
}

export async function checkFreighter(): Promise<WalletState | null> {
  try {
    const connected = unpackBoolean((await isConnected()) as FreighterBoolean);
    if (!connected) return null;
    const address = unpackAddress((await getAddress()) as FreighterAddress);
    return { address };
  } catch {
    return null;
  }
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
): Promise<SubmitResult> {
  if (!stellarConfig.contractId) {
    throw new Error("Missing VITE_AGENTRAIL_CONTRACT_ID.");
  }

  const server = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);
  const account = await server.getAccount(source);
  const contract = new StellarSdk.Contract(stellarConfig.contractId);
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(transaction);
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

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    stellarConfig.networkPassphrase,
  ) as StellarSdk.Transaction;
  const submitted = await server.sendTransaction(signedTransaction);
  if (submitted.status !== "PENDING") {
    throw new Error(`RPC rejected transaction with status ${submitted.status}.`);
  }

  let confirmed = await server.getTransaction(submitted.hash);
  while (confirmed.status === "NOT_FOUND") {
    await new Promise((resolve) => window.setTimeout(resolve, 1100));
    confirmed = await server.getTransaction(submitted.hash);
  }

  if (confirmed.status !== "SUCCESS") {
    throw new Error(`Transaction failed with status ${confirmed.status}.`);
  }

  return {
    hash: submitted.hash,
    status: confirmed.status,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${submitted.hash}`,
  };
}

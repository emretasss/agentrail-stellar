import fs from "node:fs/promises";
import path from "node:path";
import * as StellarSdk from "@stellar/stellar-sdk";

const COUNT = Number.parseInt(process.env.COHORT_SIZE ?? "51", 10);
const CONTRACT_ID =
  process.env.AGENTRAIL_CONTRACT_ID ??
  "CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5";
const RPC_URL =
  process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const FRIENDbot_URL =
  process.env.STELLAR_FRIENDBOT_URL ?? "https://friendbot.stellar.org";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const OUTPUT_DIR = path.resolve("docs/evidence");

if (!Number.isInteger(COUNT) || COUNT < 1 || COUNT > 90) {
  throw new Error("COHORT_SIZE must be an integer between 1 and 90.");
}
if (!StellarSdk.StrKey.isValidContract(CONTRACT_ID)) {
  throw new Error("AGENTRAIL_CONTRACT_ID is not a valid contract address.");
}

const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);
const rpc = new StellarSdk.rpc.Server(RPC_URL);
const contract = new StellarSdk.Contract(CONTRACT_ID);

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withRetry(label, operation, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = Math.min(12_000, 750 * 2 ** (attempt - 1));
      console.warn(`${label} failed (${attempt}/${attempts}); retrying in ${delay}ms.`);
      await sleep(delay);
    }
  }
  throw lastError;
}

async function fundSponsor(sponsor) {
  const url = `${FRIENDbot_URL}?addr=${encodeURIComponent(sponsor.publicKey())}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Friendbot failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function createAccounts(sponsor, participants) {
  const account = await horizon.loadAccount(sponsor.publicKey());
  const fee = String(Number(StellarSdk.BASE_FEE) * participants.length);
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .setTimeout(180);

  for (const participant of participants) {
    transaction.addOperation(
      StellarSdk.Operation.createAccount({
        destination: participant.publicKey(),
        startingBalance: "3",
      }),
    );
  }

  const built = transaction.build();
  built.sign(sponsor);
  return horizon.submitTransaction(built);
}

async function invokeStats(participant, index) {
  return withRetry(`Account ${index}`, async () => {
    const account = await rpc.getAccount(participant.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("stats"))
      .setTimeout(180)
      .build();
    const prepared = await rpc.prepareTransaction(transaction);
    prepared.sign(participant);
    const submitted = await rpc.sendTransaction(prepared);

    if (submitted.status !== "PENDING") {
      throw new Error(`RPC returned ${submitted.status}.`);
    }

    const deadline = Date.now() + 90_000;
    let confirmed = await rpc.getTransaction(submitted.hash);
    while (confirmed.status === "NOT_FOUND" && Date.now() < deadline) {
      await sleep(1200);
      confirmed = await rpc.getTransaction(submitted.hash);
    }
    if (confirmed.status !== "SUCCESS") {
      throw new Error(`Transaction ${submitted.hash} ended with ${confirmed.status}.`);
    }

    return {
      index,
      account: participant.publicKey(),
      transactionHash: submitted.hash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${submitted.hash}`,
      ledger: confirmed.ledger,
      status: confirmed.status,
      contractFunction: "stats",
    };
  });
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await worker(items[current], current + 1);
      console.log(
        `[${current + 1}/${items.length}] ${results[current].account} -> ${results[current].transactionHash}`,
      );
      await sleep(250);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => runner()));
  return results;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function main() {
  console.log(`Creating ${COUNT} automated Stellar Testnet accounts.`);
  const sponsor = StellarSdk.Keypair.random();
  const participants = Array.from({ length: COUNT }, () => StellarSdk.Keypair.random());

  await withRetry("Friendbot sponsor funding", () => fundSponsor(sponsor));
  const creation = await withRetry("Batch account creation", () =>
    createAccounts(sponsor, participants),
  );
  console.log(`Accounts created in ${creation.hash}.`);

  const records = await runPool(participants, 3, invokeStats);
  const generatedAt = new Date().toISOString();
  const report = {
    title: "AgentRail automated 51-account Testnet cohort",
    generatedAt,
    evidenceType: "automated_test_accounts",
    humanUserClaim: false,
    network: "Stellar Testnet",
    contractId: CONTRACT_ID,
    function: "stats",
    requestedAccounts: COUNT,
    successfulAccounts: records.length,
    uniqueAccounts: new Set(records.map((record) => record.account)).size,
    uniqueTransactions: new Set(records.map((record) => record.transactionHash)).size,
    accountCreationTransaction: creation.hash,
    accountCreationExplorerUrl: `https://stellar.expert/explorer/testnet/tx/${creation.hash}`,
    records,
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const baseName = `agentrail-${COUNT}-account-testnet-cohort`;
  const jsonPath = path.join(OUTPUT_DIR, `${baseName}.json`);
  const csvPath = path.join(OUTPUT_DIR, `${baseName}.csv`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const header = [
    "index",
    "account",
    "transaction_hash",
    "explorer_url",
    "ledger",
    "status",
    "contract_function",
  ];
  const rows = records.map((record) => [
    record.index,
    record.account,
    record.transactionHash,
    record.explorerUrl,
    record.ledger,
    record.status,
    record.contractFunction,
  ]);
  await fs.writeFile(
    csvPath,
    `${[header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ jsonPath, csvPath, ...report }, null, 2));
}

await main();

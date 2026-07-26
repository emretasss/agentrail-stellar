import { track as vercelTrack } from "@vercel/analytics";
import type { Feedback, WalletEvidence } from "@/types/agentrail";

const ANALYTICS_KEY = "agentrail.analytics.v1";
const EVIDENCE_KEY = "agentrail.wallet-evidence.v1";
const FEEDBACK_KEY = "agentrail.feedback.v1";

type ProductEvent = {
  name: string;
  properties: Record<string, string | number | boolean>;
  at: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in privacy mode. Product flows must still work.
  }
}

export function trackEvent(
  name: string,
  properties: Record<string, string | number | boolean> = {},
) {
  const events = readJson<ProductEvent[]>(ANALYTICS_KEY, []);
  events.push({ name, properties, at: new Date().toISOString() });
  writeJson(ANALYTICS_KEY, events.slice(-250));

  if (import.meta.env.PROD) {
    vercelTrack(name, properties);
  }
}

export function recordWalletConnection(address: string) {
  const records = readJson<WalletEvidence[]>(EVIDENCE_KEY, []);
  if (!records.some((record) => record.address === address)) {
    records.push({
      address,
      connectedAt: new Date().toISOString(),
      transactions: [],
      feedbackSubmitted: false,
    });
    writeJson(EVIDENCE_KEY, records);
  }
  trackEvent("wallet_connected", { wallet: `${address.slice(0, 6)}…${address.slice(-4)}` });
}

export function recordWalletTransaction(
  address: string,
  hash: string,
  action: string,
) {
  const records = readJson<WalletEvidence[]>(EVIDENCE_KEY, []);
  const existing = records.find((record) => record.address === address);
  const transaction = { hash, action, at: new Date().toISOString() };

  if (existing) {
    if (!existing.transactions.some((item) => item.hash === hash)) {
      existing.transactions.push(transaction);
    }
  } else {
    records.push({
      address,
      connectedAt: new Date().toISOString(),
      transactions: [transaction],
      feedbackSubmitted: false,
    });
  }
  writeJson(EVIDENCE_KEY, records);
  trackEvent("transaction_confirmed", { action, hash });
}

export function saveFeedback(feedback: Feedback) {
  const feedbackItems = readJson<Feedback[]>(FEEDBACK_KEY, []);
  feedbackItems.push(feedback);
  writeJson(FEEDBACK_KEY, feedbackItems);

  const evidence = readJson<WalletEvidence[]>(EVIDENCE_KEY, []);
  const wallet = evidence.find((record) => record.address === feedback.wallet);
  if (wallet) wallet.feedbackSubmitted = true;
  writeJson(EVIDENCE_KEY, evidence);
  trackEvent("feedback_submitted", { score: feedback.score, role: feedback.role });
}

export function getEvidence(): WalletEvidence[] {
  return readJson<WalletEvidence[]>(EVIDENCE_KEY, []);
}

export function getFeedback(): Feedback[] {
  return readJson<Feedback[]>(FEEDBACK_KEY, []);
}

export function getAnalyticsEvents(): ProductEvent[] {
  return readJson<ProductEvent[]>(ANALYTICS_KEY, []);
}

export function downloadValidationReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    wallets: getEvidence(),
    feedback: getFeedback(),
    events: getAnalyticsEvents(),
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agentrail-validation-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

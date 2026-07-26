import type { ActivityEvent, Agent, Job, RegisterForm } from "@/types/agentrail";

export const sampleAgents: Agent[] = [
  {
    id: 1,
    handle: "vision-api",
    name: "Vision Intelligence",
    endpoint: "https://api.agentrail.dev/vision",
    category: "Computer Vision",
    priceStroops: 250_000n,
    rating: 4.9,
    completed: 128,
    active: true,
    owner: "GAGENTVISIONDEMOADDRESS",
    responseTime: "1.8s",
    successRate: 99.2,
    verified: true,
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
    responseTime: "4.2s",
    successRate: 98.7,
    verified: true,
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
    responseTime: "2.6s",
    successRate: 97.9,
    verified: true,
  },
  {
    id: 4,
    handle: "ledger-lens",
    name: "Ledger Risk Analyst",
    endpoint: "https://api.agentrail.dev/risk",
    category: "Risk & Compliance",
    priceStroops: 680_000n,
    rating: 4.9,
    completed: 42,
    active: true,
    owner: "GAGENTLEDGERDEMOADDRESS",
    responseTime: "3.4s",
    successRate: 99.6,
    verified: true,
  },
];

export const sampleJobs: Job[] = [
  {
    id: 14,
    agentId: 2,
    payer: "Rise In demo buyer",
    amountStroops: 520_000n,
    status: "Delivered",
    brief: "Verify invoice, satellite timestamp, and cooperative attestation.",
    briefHash:
      "7a2a5c2f2bcdf8f8dcbd8ad5e99a1973b8d70fb81ce2f184bc7f9fc091f4f9cd",
    deliverableHash:
      "d2ad8f1a9a4027ea57f3ea88f813587cbd1c71e42087af52d92a44bc4a41e924",
    createdAt: "2026-07-26T08:38:00.000Z",
  },
  {
    id: 13,
    agentId: 1,
    payer: "GA7N...PQ4M",
    amountStroops: 250_000n,
    status: "Released",
    brief: "Analyze storefront imagery and return normalized product labels.",
    briefHash:
      "bc82f73d0d872d5e12c0ad227a8a90a14a76c383cde66ddc4f25f594dfab4a8e",
    rating: 5,
    createdAt: "2026-07-26T07:12:00.000Z",
  },
  {
    id: 12,
    agentId: 3,
    payer: "GB2K...91RM",
    amountStroops: 390_000n,
    status: "Funded",
    brief: "Validate creator attribution and generate a provenance receipt.",
    briefHash:
      "cd832c5328bb4f5ea125f3bb19c6d5c413503496fc1098f64afdf20315cc14aa",
    createdAt: "2026-07-25T20:42:00.000Z",
  },
];

export const initialRegisterForm: RegisterForm = {
  handle: "",
  name: "",
  endpoint: "",
  category: "Data & Research",
  price: "0.05",
};

export const initialActivity: ActivityEvent[] = [
  {
    id: "contract-ready",
    label: "Protocol online",
    detail: "Soroban escrow contract is responding on Stellar Testnet.",
    tone: "success",
    at: new Date().toISOString(),
  },
  {
    id: "security-ready",
    label: "Escrow protection active",
    detail: "Payment releases only after verified buyer approval.",
    tone: "neutral",
    at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
];

export const volumeSeries = [
  { day: "Mon", volume: 12.4, jobs: 18 },
  { day: "Tue", volume: 16.8, jobs: 24 },
  { day: "Wed", volume: 14.2, jobs: 21 },
  { day: "Thu", volume: 22.6, jobs: 31 },
  { day: "Fri", volume: 28.1, jobs: 38 },
  { day: "Sat", volume: 24.7, jobs: 34 },
  { day: "Sun", volume: 33.9, jobs: 47 },
];

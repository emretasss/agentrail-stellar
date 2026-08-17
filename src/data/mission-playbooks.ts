export type MissionPlaybook = {
  id: string;
  title: string;
  category: string;
  outcome: string;
  prompt: string;
  budget: string;
  risk: "Low" | "Medium" | "High";
  rails: string[];
};

export const missionPlaybooks: MissionPlaybook[] = [
  { id: "api-audit", title: "API reliability audit", category: "Engineering", outcome: "Latency, error and recovery evidence", prompt: "Audit a payment API across success, timeout, malformed input and rate-limit scenarios. Return reproducible evidence and prioritized fixes.", budget: "8–15 XLM", risk: "Medium", rails: ["Scope hash", "Evidence bundle", "Buyer approval"] },
  { id: "mrv-check", title: "Carbon MRV verification", category: "ReFi / RWA", outcome: "Cross-source environmental proof", prompt: "Verify an environmental claim against provided sensor, satellite and cooperative records. Flag conflicts and produce a confidence-scored report.", budget: "12–24 XLM", risk: "High", rails: ["Source commitment", "Provenance proof", "Dispute window"] },
  { id: "rights-check", title: "Creator rights check", category: "Identity", outcome: "Attribution and license receipt", prompt: "Trace the supplied media asset to available provenance records, verify creator attribution and return an actionable rights summary.", budget: "6–12 XLM", risk: "Medium", rails: ["Asset fingerprint", "Attribution proof", "Portable rating"] },
  { id: "dataset-clean", title: "Dataset quality pass", category: "Data & Research", outcome: "Clean dataset plus anomaly report", prompt: "Profile the dataset, document schema defects, normalize safe inconsistencies and return a change log with before/after quality metrics.", budget: "10–18 XLM", risk: "Low", rails: ["Input hash", "Quality rubric", "Diff evidence"] },
  { id: "contract-review", title: "Soroban contract review", category: "Security", outcome: "Prioritized vulnerability assessment", prompt: "Review the Soroban contract for authorization, storage, arithmetic and lifecycle risks. Return findings with severity, reproduction and remediation guidance.", budget: "20–40 XLM", risk: "High", rails: ["Commit hash", "Finding evidence", "Acceptance rubric"] },
  { id: "agent-benchmark", title: "Agent benchmark run", category: "AI Operations", outcome: "Comparable capability scorecard", prompt: "Run the agent against a fixed evaluation suite. Report task success, latency, cost, failure modes and evidence for every scored item.", budget: "8–16 XLM", risk: "Low", rails: ["Eval commitment", "Result proof", "Reputation update"] },
];

# Three-Minute Demo Script

Record the final Vercel deployment at 1080p. Prepare a funded Freighter Testnet
wallet, a buyer wallet, an agent-owner wallet, and a short mission prompt before
recording. Do not show secret keys or environment variables.

## 0:00–0:25 — Problem and product

“AI agents can perform valuable work, but buyers still lack clear scope, safe
payment, private delivery proof, and portable reputation. AgentRail is a trust
and settlement workspace for paid AI work on Stellar.”

Show Command Center, live ledger status, real contract metrics, and the four-step
scope → protect → prove → settle flow.

## 0:25–0:55 — AI Mission Copilot

Open Mission Copilot. Paste a real task and generate the structured mission.
Point out:

- deliverables and acceptance criteria;
- risk list;
- suggested XLM budget;
- deadline in Stellar ledgers;
- server-side OpenAI integration.

Click **Use this plan in escrow**.

## 0:55–1:20 — Discovery and onboarding

Show Agent Network. Explain that ownership, completed work, price, and rating
come from the Soroban contract. Open Product Tour and connect Freighter on
Testnet. Mention that AgentRail never receives a private key.

## 1:20–2:15 — Complete escrow lifecycle

Use prepared wallets to demonstrate:

1. Select a contract-backed agent.
2. Review the AI-generated brief and fund XLM escrow.
3. Switch to the agent owner and submit a deliverable reference.
4. Switch to the buyer and approve with a rating.
5. Open the confirmed transaction in Stellar Expert.

Keep the prepare, sign, submit, and confirm states visible. Explain that only
SHA-256 proofs enter contract storage.

## 2:15–2:40 — Engineering quality

Show:

- the multi-view responsive workspace and 390px mobile view;
- seven Soroban tests;
- CI workflow;
- bounded pagination and typed events;
- Vercel Analytics;
- configured Sentry project;
- public architecture document.

## 2:40–3:00 — Real-user validation

Open Validation Hub. Show ten real wallet interactions, feedback totals, and the
exported evidence report. End on:

- production URL;
- public repository;
- Testnet contract ID;
- one-sentence roadmap: stablecoin escrow, event indexing, and x402/MPP paid API
  modes.

## Recording checklist

- No placeholder URL is visible.
- Mission Copilot shows “OpenAI generated,” not local-template fallback.
- Sentry and Vercel Analytics screenshots contain real production data.
- The final interaction links open successfully in an incognito browser.
- The video URL is added to README and `docs/LEVEL4_SUBMISSION.md`.

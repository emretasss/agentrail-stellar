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

## 2:15–2:30 — Engineering quality

Show:

- the multi-view responsive workspace and 390px mobile view;
- seven Soroban tests;
- CI workflow;
- bounded pagination and typed events;
- Vercel Analytics;
- configured Sentry project;
- public architecture document.

## 2:30–2:50 — Growth Lab proof verification

Open Growth Lab, select a real participant role and mission, paste the completed
transaction hash, and show Horizon verifying transaction success, the wallet,
the AgentRail contract invocation, function name, and ledger. Copy the referral
link and open the participant feedback form.

## 2:50–3:00 — Level 5 growth evidence

Open Validation Hub. Show 50 verified wallet interactions, the published Google
Form, feedback totals, the Excel evidence dashboard, and the exported response
sheet. Do not record this segment until the cohort is genuinely complete. End
on:

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
- Growth Lab accepts a real AgentRail hash and rejects a non-contract Testnet hash.
- No participant email address or secret wallet material is visible.
- The video URL is added to README and `docs/LEVEL5_SUBMISSION.md`.

The repository includes a concise visual walkthrough at
[`docs/demo/AgentRail-Level5-Demo.webm`](demo/AgentRail-Level5-Demo.webm). It
does not replace the final signed-wallet cohort demo described above.

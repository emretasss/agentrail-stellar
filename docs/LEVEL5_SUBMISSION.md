# Blue Belt Level 5 Submission Runbook

This runbook keeps implemented product work separate from claims that require
real people. Do not count project-owned wallets as independent users, invent
feedback, or reuse a transaction hash for multiple participants.

## Submission assets

| Asset | Location | State |
| --- | --- | --- |
| Public repository | <https://github.com/emretasss/agentrail-stellar> | Ready |
| Live application | <https://agentrail-stellar.vercel.app> | Ready |
| Testnet contract | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5) | Ready |
| Participant form | [Published Google Form](https://docs.google.com/forms/d/e/1FAIpQLSfWWZxgMNLxVi7SHGKc9Y-Q66d5Dy4KHZSi72fKTtWPUFhX2A/viewform) | Ready |
| Pitch deck | [AgentRail-Level5-Pitch-Deck.pptx](pitch/AgentRail-Level5-Pitch-Deck.pptx) | Ready |
| Walkthrough video | [AgentRail-Level5-Demo.webm](demo/AgentRail-Level5-Demo.webm) | Ready |
| Excel evidence workbook | [AgentRail-Level5-User-Evidence.xlsx](evidence/AgentRail-Level5-User-Evidence.xlsx) | Ready for real responses |
| Growth Lab proof screenshot | [agentrail-growth-lab.png](screenshots/agentrail-growth-lab.png) | Ready |
| Transaction screenshot | [stellar-contract-activity.png](evidence/stellar-contract-activity.png) | Ready |
| 51-account JSON evidence | [agentrail-51-account-testnet-cohort.json](evidence/agentrail-51-account-testnet-cohort.json) | Ready — 51/51 successful |
| 51-account CSV evidence | [agentrail-51-account-testnet-cohort.csv](evidence/agentrail-51-account-testnet-cohort.csv) | Ready — 51 unique accounts and hashes |
| 51-account activity screenshot | [stellar-51-account-contract-activity.png](evidence/stellar-51-account-contract-activity.png) | Ready |
| Verified 50-user cohort | Workbook dashboard | Pending real participants |

## Automated 51-account Testnet run

The account-scale test is complete and reproducible. On 2026-08-17 the runner:

1. created one Friendbot-funded sponsor account in memory;
2. created 51 unique Testnet accounts in public transaction
   [`eeb83b26…bcd4d3`](https://stellar.expert/explorer/testnet/tx/eeb83b26866beff61fe36d52e88263854388958a938dffdfb9224b30b8bcd4d3);
3. signed and submitted an AgentRail `stats` invocation from each account;
4. confirmed 51 successful transactions, 51 unique accounts, and 51 unique
   transaction hashes;
5. exported only public addresses, hashes, ledgers, status, and explorer URLs.

No secret keys were written to disk. Run `npm run evidence:testnet-cohort` to
repeat the test. This proves 50+ account-scale contract activity, not 50+
independent human users.

## Major v0.4 product iteration

The August reviewer feedback said the repository showed no substantial product
change beyond CI/CD. AgentRail v0.4 answers that feedback with a new **Growth
Lab** workspace:

- role-based buyer, agent, and explorer onboarding;
- five guided real-use-case missions;
- direct Horizon Testnet transaction lookup;
- successful-transaction, participant-wallet, and AgentRail-contract checks;
- decoded contract function and ledger evidence;
- deduplication by transaction hash;
- referral-tagged invite links and return-visit analytics;
- published Google Form handoff and local 0/50 cohort progress.

Implementation: [verifiable Testnet Growth Lab](https://github.com/emretasss/agentrail-stellar/commit/46db3475e2d787714e0429ed24cc7e78940eeb2e).
This iteration is based on actual reviewer feedback; cohort feedback findings
remain pending until real participant responses exist.

## What the form collects

Every field is required:

1. Full name
2. Email address
3. Public Stellar Testnet wallet address
4. Successful Testnet transaction hash
5. AgentRail flow completed
6. Product rating from 1 to 5
7. What worked well
8. What should improve next
9. Consent to use the public wallet, transaction hash, rating, and anonymized
   feedback as Level 5 evidence

The form explicitly warns participants never to submit a secret key, seed
phrase, or private key. Its responses are connected to a Google Sheet in the
project owner's Drive.

## Fifty-user validation protocol

Recruit at least 50 independent people. Each participant should:

1. Open the production application.
2. Complete the product tour.
3. Connect a wallet configured for Stellar Testnet.
4. Complete at least one meaningful product or contract flow.
5. Wait for a successful transaction and open its public explorer record.
6. Submit the Level 5 Google Form with the public wallet and transaction hash.
7. Give product feedback and consent to the stated evidence use.

Meaningful contract actions include agent registration, job creation and
funding, delivery proof, payment release, refund, dispute, or dispute
resolution. A wallet connection alone is not a transaction.

## Excel export and verification

After collecting responses:

1. Open the linked response Sheet from the Google Form's **Responses** tab.
2. Use **File → Download → Microsoft Excel (.xlsx)**.
3. Keep the original export as a dated source artifact.
4. Copy the response rows into the workbook's **Form Responses** sheet.
5. Add verified participant records to **Participants**.
6. Open every transaction URL and confirm that it is successful on Testnet.
7. Reject duplicate wallets, duplicate hashes, missing consent, or failed
   transactions.
8. Confirm that the **Dashboard** reports at least 50 verified users.
9. Commit the sanitized workbook. Do not publish a screenshot containing email
   addresses.

The repository workbook is a schema and analysis file, not a claim that 50
responses already exist. Its initial state is 0 verified users and 50 empty
participant slots.

## Feedback analysis and product iteration

Analyze responses by theme and severity:

- onboarding and time to first successful action;
- wallet connection, network selection, signing, and confirmation failures;
- clarity of agent discovery, mission scope, and escrow states;
- mobile usability and accessibility;
- trust, privacy, and transaction transparency;
- requested wallet, asset, API, and analytics integrations.

For every implemented cohort-driven change, add one row to the workbook's
**Improvement Log** containing the feedback theme, evidence count, decision,
implementation, validation result, and a direct GitHub commit URL. Update the
README summary with the same link. Do not describe a change as
"feedback-driven" until real responses support it.

Existing implementation baselines:

- [Guided onboarding and validation evidence](https://github.com/emretasss/agentrail-stellar/commit/8893a05)
- [Wallet and transaction lifecycle hardening](https://github.com/emretasss/agentrail-stellar/commit/1ddd5bb)
- [Responsive production workflows](https://github.com/emretasss/agentrail-stellar/commit/3895cfa)
- [Contract pagination and overflow protection](https://github.com/emretasss/agentrail-stellar/commit/314635c)

## Pitch and demo coverage

The pitch deck covers the problem, solution, market opportunity, product flow,
architecture, technical proof, growth strategy, roadmap, and closing ask. Slide
speaker notes contain source URLs.

The repository WebM is a concise visual walkthrough. For the final public demo,
use [DEMO_SCRIPT.md](DEMO_SCRIPT.md) to record a signed buyer/agent lifecycle
with real prepared Testnet wallets. Keep secret keys, recovery phrases,
environment variables, private deliverables, and participant emails off-screen.

## Final go/no-go checklist

- [x] Public GitHub repository
- [x] More than 20 meaningful commits
- [x] Live deployed application
- [x] Published Google Form with required fields and consent
- [x] Linked Google response Sheet
- [x] Excel evidence workbook linked from README
- [x] Pitch deck linked from README
- [x] Product walkthrough linked from README
- [x] Public Testnet contract and transaction evidence
- [x] Transaction-activity screenshot
- [x] 51 unique automated Testnet accounts verified
- [x] 51 unique successful AgentRail contract transactions verified
- [x] Updated README and documentation
- [ ] 50 independent participants verified
- [ ] 50 successful participant transactions verified
- [ ] Aggregate active-usage evidence captured without private emails
- [ ] Real feedback summarized
- [ ] At least one cohort-driven change implemented and linked to its commit
- [ ] Final public video demonstrates the signed transaction lifecycle

Submit only after every unchecked item has real evidence. The external cohort
is the remaining blocker; it cannot be completed safely or honestly by source
code alone.

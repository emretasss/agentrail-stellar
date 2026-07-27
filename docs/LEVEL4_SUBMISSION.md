# Green Belt Level 4 Submission

This document separates implemented product work from evidence that must be
collected from real people. Do not replace missing evidence with mock data.

## Implemented

- Production-quality responsive dark UI built with shadcn/Radix primitives.
- Freighter onboarding with Testnet network validation.
- Agent publishing, escrow funding, delivery proof, and approval workflows.
- Loading, signing, submission, confirmation, success, and error states.
- Sentry-ready error monitoring and production analytics integration.
- Unique-wallet, confirmed-transaction, and feedback evidence capture.
- One-click validation report export.
- Seven Soroban unit tests, checked arithmetic, and bounded pagination.
- CI quality gates for frontend build, dependency audit, Rust formatting, tests,
  and optimized WASM compilation.
- Public GitHub repository and more than 15 meaningful commits.

## Real-user validation target

Recruit at least 10 people who each:

1. Open the production URL.
2. Complete onboarding and connect Freighter on Testnet.
3. Perform at least one successful contract interaction.
4. Submit the in-product feedback form.

After the session, select **Share feedback → Export validation evidence**. The
report contains unique wallet addresses, confirmed transaction hashes, event
timestamps, scores, roles, and written feedback.

## Evidence status

| Requirement | Status | Evidence |
| --- | --- | --- |
| Public repository | Ready | Repository URL in README |
| 15+ commits | Ready | Git history |
| Testnet contract | Ready | Contract and transaction links in README |
| Desktop UI | Ready | Capture from production |
| Mobile UI | Ready | Capture at 390×844 |
| Monitoring/analytics | Ready to configure | Add production Sentry DSN |
| 10 real wallets | Pending real cohort | Exported validation report |
| Feedback summary | Pending real cohort | Template below |
| Demo video | Pending recording | Script in `docs/DEMO_SCRIPT.md` |

## Feedback summary template

- Cohort size:
- Buyer / agent / explorer split:
- Average usefulness score:
- Most common positive theme:
- Most common friction:
- Top requested feature:
- Product change made from feedback:

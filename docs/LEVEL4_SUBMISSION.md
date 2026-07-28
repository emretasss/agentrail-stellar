# Green Belt Level 4 Submission Runbook

This runbook distinguishes implemented product work from external proof that
must be produced by real users or publishing platforms. Never replace missing
evidence with mock wallets, invented feedback, screenshots of local placeholders,
or fake video links.

## Requirement audit

| Requirement | Product status | Submission evidence |
| --- | --- | --- |
| Production-ready MVP | Implemented | Vercel production URL + demo |
| Stable frontend architecture | Implemented | README + architecture document + CI |
| Stable smart contract | Implemented | Testnet ID, source, seven tests, transaction links |
| Mobile responsive | Implemented | Final 390×844 production screenshot |
| Loading/error states | Implemented | Demonstrate RPC retry and transaction stages |
| User onboarding | Implemented | Product tour recording |
| 10 real users | External evidence pending | Ten distinct participants |
| Wallet interaction proof | Collection ready | Public Testnet transaction URLs |
| Feedback collection | Implemented | Form, export, optional forwarding |
| Production deployment | External action pending | Final Vercel URL |
| Monitoring/analytics | Code implemented | Vercel Analytics screenshot + configured Sentry screenshot |
| Optimized UX | Implemented | Build output, responsive test, reduced-motion behavior |
| Project structure/docs | Implemented | Repository documentation |
| Contract on Testnet | Implemented | Contract Explorer link |
| 15+ commits | Implemented | Public Git history |
| Public GitHub repository | Implemented | Repository URL |
| Live demo video | External action pending | Public video URL |
| Product/mobile screenshots | External action pending | Capture final production release |
| Feedback summary | External evidence pending | Cohort analysis below |

## Production release

1. Import the public GitHub repository into Vercel.
2. Add every environment variable from `docs/VERCEL_DEPLOYMENT.md`.
3. Add a real server-only `OPENAI_API_KEY`.
4. Enable Vercel Web Analytics.
5. Create a Sentry browser project and add its public DSN.
6. Optionally configure a private `FEEDBACK_WEBHOOK_URL`.
7. Deploy and run the complete buyer and agent paths.
8. Add the production URL to README and this document.

## Ten-user validation protocol

Recruit at least ten real people. Use different wallets; do not create ten
wallets controlled by the project owner.

Each participant should:

1. Open the production URL on desktop or mobile.
2. Complete the product tour.
3. Connect Freighter on Stellar Testnet.
4. Use Mission Copilot or manually write a work brief.
5. Perform at least one meaningful contract interaction.
6. Submit the in-product feedback form.
7. Consent to including their public Testnet address and transaction link in the
   submission evidence.

A meaningful interaction can be agent registration, escrow creation, delivery,
approval, refund, or dispute. Wallet connection alone is not sufficient.

## Evidence table

Fill this table with real public records:

| # | Participant alias | Wallet | Action | Transaction URL | Feedback received |
| --- | --- | --- | --- | --- | --- |
| 1 | Pending | Pending | Pending | Pending | No |
| 2 | Pending | Pending | Pending | Pending | No |
| 3 | Pending | Pending | Pending | Pending | No |
| 4 | Pending | Pending | Pending | Pending | No |
| 5 | Pending | Pending | Pending | Pending | No |
| 6 | Pending | Pending | Pending | Pending | No |
| 7 | Pending | Pending | Pending | Pending | No |
| 8 | Pending | Pending | Pending | Pending | No |
| 9 | Pending | Pending | Pending | Pending | No |
| 10 | Pending | Pending | Pending | Pending | No |

## Screenshot checklist

Capture the final production release, not an obsolete local build:

- Command Center at desktop width
- Agent Network with at least one real agent
- Escrow job lifecycle
- Mission Copilot structured result
- Mobile layout at 390×844
- Vercel Analytics dashboard
- Sentry issue/performance setup
- Stellar Explorer contract page
- Ten-user interaction evidence

Store approved screenshots in `docs/screenshots/` and reference them from README.

## Feedback summary template

- Cohort size:
- Test dates:
- Buyer / agent / explorer split:
- Desktop / mobile split:
- Average usefulness score:
- Completion rate:
- Median time to first successful transaction:
- Most common positive theme:
- Most common point of confusion:
- Top requested feature:
- Product change made from feedback:
- Remaining risk:

Include short paraphrases. Obtain explicit permission before publishing a direct
quote or identifiable information.

## Final submission fields

- Repository: `https://github.com/emretasss/agentrail-stellar`
- Production URL: **Pending**
- Contract:
  `CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5`
- Demo video: **Pending**
- Commit count: verify immediately before submission
- Ten-user evidence: **Pending real cohort**
- Feedback summary: **Pending real cohort**

## Final go/no-go check

Do not submit until every item marked **Pending** has a real URL, screenshot, or
cohort artifact and all links have been tested in an incognito browser.

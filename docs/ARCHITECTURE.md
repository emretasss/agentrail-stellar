# AgentRail Architecture

## Product boundaries

AgentRail is a non-custodial marketplace and escrow layer. The browser owns
presentation, onboarding, wallet orchestration, feedback capture, and transaction
status. The Soroban contract owns authorization, escrow state, deadlines,
settlement, disputes, and reputation totals.

## Frontend

- React 19 and TypeScript with strict compilation.
- Vite production build with isolated Stellar, chart, monitoring, and UI chunks.
- shadcn-style primitives backed by Radix UI and Tailwind CSS v4.
- Freighter signs prepared Soroban transactions; private keys never reach the app.
- Every write follows `prepare → sign → submit → confirm`, with a 60-second
  confirmation ceiling and normalized user-facing errors.
- Sentry is enabled only when `VITE_SENTRY_DSN` is configured and does not send PII.
- Vercel Analytics records aggregate production product events.
- Local validation storage records unique wallet addresses, confirmed transaction
  hashes, and feedback. It can be exported for the Level 4 review.

## Smart contract

- Constructor pins the admin and SEP-41 token contract.
- Every owner, payer, and administrator mutation uses explicit authorization.
- Briefs and deliverables are represented by 32-byte hashes; private content stays
  off-chain.
- Escrow state is a bounded enum: Funded, Delivered, Released, Refunded, Disputed.
- Arithmetic uses checked operations.
- Registry reads expose bounded pagination with a maximum page size of 50.
- Contract metadata identifies version `0.2.0`.
- Typed events provide an indexable lifecycle trail.

## Data flow

1. The wallet address is read from Freighter and its network passphrase is verified.
2. The browser builds and simulates the contract call.
3. Freighter displays and signs the prepared envelope.
4. Stellar RPC accepts the transaction and the client polls for finality.
5. The confirmed hash is shown in the UI and stored as validation evidence.

## Scale path

- Replace local validation storage with a consented API/database when the first
  cohort exceeds one device.
- Index typed contract events for marketplace search and historical analytics.
- Keep direct contract reads paginated.
- Move high-cardinality metadata to an off-chain index while retaining hashes and
  settlement state on Stellar.

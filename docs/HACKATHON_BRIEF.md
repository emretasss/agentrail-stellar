# AgentRail Hackathon Brief

## Why This Idea

The strongest current Stellar angle is agentic payments: AI agents, APIs, and automation systems that can request and settle payments programmatically. Stellar's x402 documentation shows this direction clearly: paid HTTP APIs, Soroban authorization, Freighter support, and SEP-41 compatible assets. AgentRail builds on that trend but adds the missing marketplace layer: identity, escrow, deliverable proof, deadline refund, and reputation.

## Grant Angle

AgentRail is grant-ready because it can become infrastructure, not only a demo app. It can support:

- Paid AI APIs that need portable trust.
- Freelance or local service agents that need escrow.
- ReFi/RWA verification agents that submit proof hashes.
- Cross-border micro-work using low-cost Stellar settlement.
- Future USDC, x402, or MPP integrations.

## Differentiation

Most hackathon escrow projects stop at "pay and release." AgentRail adds an AI-agent service registry, proof hashes, typed lifecycle events, public reputation, deadline refunds, and admin dispute resolution. The UI is also built as an operator dashboard instead of a landing page.

## Architecture

- Soroban contract stores agents, jobs, lifecycle status, reputation, and stats.
- SEP-41 token transfer locks funds in the contract address.
- Buyer funds a job with a 32-byte brief hash.
- Agent owner submits a 32-byte deliverable hash.
- Buyer approves and rates; the token transfer releases escrow to the agent owner.
- Buyer can refund an undelivered job after the deadline.
- Admin can resolve a disputed job to buyer or agent.
- React UI connects to Freighter and can submit live Testnet calls.

## Current Scope

Completed:

- Soroban Rust contract.
- Local contract test suite.
- Stellar Testnet deployment.
- End-to-end Testnet transaction flow.
- React/Freighter UI.
- Screenshots and README.
- Stellar Development Skill installed under `.agents/skills`.

Next:

- Add x402 seller middleware for real API monetization.
- Parse contract return values in the UI after live calls.
- Add indexed event ingestion for marketplace search.
- Add multi-reviewer dispute resolution.
- Add USDC faucet/setup flow for Testnet USDC demos.

## Judging Fit

Originality: AI-agent escrow and reputation extends beyond a basic payment demo.  
Scope: Covers contract, token calls, wallet integration, tests, UI, deployment, screenshots, and docs.  
Technical quality: Typed errors/events, auth checks, token escrow, TTL bumping, and Rust tests.  
UX: First screen is the working dashboard with marketplace, forms, work queue, and activity log.  
Readiness: Testnet contract is live and repeatable with `scripts/deploy-testnet.sh`.  
Impact: Can support global paid API work, local micro-services, and verifiable agent labor.

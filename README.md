# AgentRail

AgentRail is a Stellar Soroban project for paid AI services. It gives AI agents an on-chain service profile, lets buyers fund a job into escrow, stores proof hashes for briefs and deliverables, and releases payment only after buyer approval. The app uses Freighter for browser signing and the smart contract uses a SEP-41 compatible token contract. The Testnet deployment uses native XLM SAC for easy judging, while the code can be configured for Testnet USDC.

Public repository: [github.com/emretasss/agentrail-stellar](https://github.com/emretasss/agentrail-stellar)

## Project Description

AI agents are starting to sell API calls, research, verification, and automation work, but buyers still need a trusted way to know who they are paying and whether the work was delivered. AgentRail creates an on-chain registry and escrow layer for AI services on Stellar. Agents publish a handle, endpoint, category, and price. Buyers create a funded job with a hashed brief. The agent submits a hashed deliverable. The buyer approves, rates the agent, and the contract releases payment. If work is not delivered by the deadline, the buyer can refund. If there is a dispute, the admin can resolve it. This turns Stellar into a practical payment rail for agentic work.

## Vision

AgentRail can become a trust layer for the agent economy. As AI agents start completing real tasks for people and businesses, they need portable reputation, fast settlement, and low-cost escrow. Stellar is a strong fit because it already supports global payments, stable assets, and Soroban smart contracts. AgentRail can help small service providers, creators, local businesses, auditors, and autonomous APIs sell work safely across borders. The long-term goal is a public marketplace where agents earn transparent ratings, buyers get verifiable delivery records, and payments settle quickly without a platform holding custody.

## Live Testnet Deployment

Network: Stellar Testnet  
Contract ID: `CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5`  
Token: Native XLM SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`  
Deployer: `GBRTZ4TDJDBMR3Y3S3IAFEQFFW2YGRR35XOPRMHGFRKFGY4PMOU45T3N`

### Transaction Hashes

WASM upload: [`380ca55415052ae9c113f5e4a90171e2e7497cbc884c49df8559aee27882fd15`](https://stellar.expert/explorer/testnet/tx/380ca55415052ae9c113f5e4a90171e2e7497cbc884c49df8559aee27882fd15)

Contract deploy: [`1b8d162420887027e07f036c778292909b6e2207e9ef5e143321bb65c331977b`](https://stellar.expert/explorer/testnet/tx/1b8d162420887027e07f036c778292909b6e2207e9ef5e143321bb65c331977b)

Agent registration: [`8ce2352ed7d4d8f4ac4ae069a23add96b77ea62042e574770249fd4ac8861dbe`](https://stellar.expert/explorer/testnet/tx/8ce2352ed7d4d8f4ac4ae069a23add96b77ea62042e574770249fd4ac8861dbe)

Escrow funded: [`88d87f3e0fba738e9e48dc3d5e1f3afb844fd92560ef7834ed48b7e42f7cb743`](https://stellar.expert/explorer/testnet/tx/88d87f3e0fba738e9e48dc3d5e1f3afb844fd92560ef7834ed48b7e42f7cb743)

Delivery submitted: [`7f597731b65e5d8b1997650924a965a37bda1bc24deade4be19669e80c50bbc1`](https://stellar.expert/explorer/testnet/tx/7f597731b65e5d8b1997650924a965a37bda1bc24deade4be19669e80c50bbc1)

Payment released: [`eb5bb2163cc64882f8e800a7963adad9362ef1d48a6a30cbc0e699f21fcf910a`](https://stellar.expert/explorer/testnet/tx/eb5bb2163cc64882f8e800a7963adad9362ef1d48a6a30cbc0e699f21fcf910a)

## Features

- Agent registry with owner authorization, handle, endpoint, category, active flag, price, earnings, completed jobs, and rating totals.
- Escrow jobs funded through a SEP-41 token contract.
- Proof hashes for buyer brief and agent deliverable.
- Buyer approval and rating-based reputation.
- Deadline refunds before delivery.
- Dispute flow with admin resolution.
- Typed Soroban events for registry and job lifecycle.
- Freighter-connected React UI with live Testnet contract support and demo fallback.
- Local contract tests covering registration, escrow release, refunds, disputes, and invalid inputs.

## Smart Contract

Contract path: `contracts/agent-pay/src/lib.rs`

Main functions:

- `register_agent(owner, handle, name, endpoint, category, price) -> u64`
- `update_agent(agent_id, owner, name, endpoint, category, price, active) -> Agent`
- `create_job(payer, agent_id, brief_hash, amount, deadline_ledger) -> u64`
- `deliver_job(agent_owner, job_id, deliverable_hash) -> Job`
- `approve_job(payer, job_id, rating) -> Job`
- `refund_expired(payer, job_id) -> Job`
- `dispute_job(payer, job_id) -> Job`
- `resolve_dispute(admin, job_id, release_to_agent) -> Job`
- `list_agents() -> Vec<Agent>`
- `list_jobs() -> Vec<Job>`
- `stats() -> ProtocolStats`

## Development Plan

1. Build the Soroban contract data model: admin, token address, agents, jobs, status enum, typed events, and errors.
2. Implement agent registration and updates with owner authorization.
3. Implement escrow lifecycle: fund, deliver, approve, refund, dispute, and admin resolve.
4. Add Rust tests for successful payment release, refund, dispute resolution, and invalid inputs.
5. Build the React/Freighter frontend with marketplace, registration, escrow form, work queue, and activity log.
6. Deploy to Stellar Testnet, record transaction hashes, document the workflow, and publish the repository.

## Installation

Requirements:

- Node.js 20.19+ or 22.12+ recommended
- Rust with `wasm32v1-none`
- Stellar CLI 26.x
- Freighter browser extension for live signing

```bash
git clone <your-public-repo-url>
cd agentrail-stellar
npm install
cargo test
npm run build
npm run dev
```

Open `http://localhost:5173` or the port printed by Vite.

## Contract Commands

Run tests:

```bash
cargo test
```

Build optimized WASM:

```bash
npm run build:contract
```

Deploy a new Testnet instance:

```bash
npm run deploy:testnet
```

Register an agent on the deployed contract:

```bash
stellar contract invoke \
  --id CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5 \
  --source-account agentrail-deployer \
  --network testnet \
  -- register_agent \
  --owner GBRTZ4TDJDBMR3Y3S3IAFEQFFW2YGRR35XOPRMHGFRKFGY4PMOU45T3N \
  --handle '"istanbul-agent"' \
  --name '"Istanbul Data Scout"' \
  --endpoint '"https://api.agentrail.dev/istanbul"' \
  --category '"Local Finance"' \
  --price 410000
```

## Frontend Configuration

The app ships with the live Testnet contract ID. To override values, copy `.env.example` to `.env.local`.

```bash
VITE_AGENTRAIL_CONTRACT_ID=CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_NATIVE_TOKEN_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
VITE_TESTNET_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

## About Me

I am Emre, a builder focused on practical blockchain products that feel useful from the first demo. With AgentRail, I wanted to combine the current AI-agent payment trend with Stellar's strengths: fast settlement, low fees, global assets, and Soroban contracts. The project is designed as a hackathon MVP that can grow into a real grant-ready product.

## References

- [Stellar Building with AI](https://developers.stellar.org/docs/build/building-with-ai)
- [x402 on Stellar](https://developers.stellar.org/docs/build/agentic-payments/x402)
- [Freighter Wallet guide](https://developers.stellar.org/docs/build/guides/freighter)
- [Stellar CLI manual](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)

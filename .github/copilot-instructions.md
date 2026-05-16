# AgentRail Stellar Instructions

This repository is a Stellar Soroban hackathon project. Prefer the installed Stellar skills in `.agents/skills` for protocol-specific guidance.

Use these defaults unless a task says otherwise:

- Network: Stellar Testnet
- Network passphrase: `Test SDF Network ; September 2015`
- Contract: `contracts/agent-pay`
- Deployed contract ID: `CB6QV6VUJH4FRSLZRTOV2HBIIXSZ4V2YRTCE3S5U4KCLZE7QFW4YTLV5`
- Native XLM SAC: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- Testnet USDC SAC: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

When changing the contract:

- Keep all auth checks explicit with `Address::require_auth`.
- Use `soroban_sdk::token::Client` for SEP-41 token transfers.
- Keep typed errors and typed events.
- Update Rust tests for every lifecycle change.
- Run `cargo test` and `stellar contract build --package agent-pay --optimize`.

When changing the frontend:

- Keep Freighter signing in `src/lib/stellar.ts`.
- Keep the UI usable without a wallet by preserving demo state.
- Run `npm run build`.

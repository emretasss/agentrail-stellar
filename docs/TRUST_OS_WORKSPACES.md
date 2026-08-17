# AgentRail Trust OS workspaces

AgentRail now treats paid agent work as an operational system rather than a single escrow form. Each workspace answers a separate trust question while sharing the same Soroban-backed mission state.

| Workspace | Trust question | Primary signal |
| --- | --- | --- |
| Command Center | Is the protocol healthy now? | RPC status, ledger and settlement funnel |
| Agent Network | Which agent is suitable? | Trust fit, availability, price and experience |
| Escrow Operations | What needs action? | Mission status, deadline health and role-aware controls |
| Treasury Console | Where is value moving? | Protected, released and refunded XLM |
| Reputation Lab | Why should this agent be trusted? | Explainable settlement-backed score |
| Mission Playbooks | How should work be scoped? | Reusable evidence and acceptance patterns |
| Mission Copilot | Is the mission fundable? | Prompt readiness and escrow plan quality |
| Network Explorer | What does the chain prove? | Contract topology and observed footprint |
| Growth Lab | How can a tester activate? | Verified Testnet mission |
| Validation Hub | What evidence is still missing? | Product and user-validation artifacts |

## Interaction model

- `Cmd/Ctrl + K` opens the command palette.
- `g` followed by `h`, `a`, `j`, `c`, `n`, `r`, `t`, or `p` routes directly to a core workspace.
- Mobile navigation uses a horizontally scrollable, snap-aligned dock so additional workspaces do not compress touch targets.
- Wallet state is always paired with a visible network-readiness signal before a signing flow.
- Every funding flow previews value, scope-proof readiness, and estimated ledger duration.

## Quality gates

Run the complete project gate with:

```bash
npm run check
```

The gate includes TypeScript compilation, Vitest business-rule tests and Soroban contract tests. A production bundle can be verified independently with `npm run build`.

## Product principle

AgentRail does not attempt to decide whether an agent output is universally “correct.” It makes the agreement explicit, preserves a cryptographic link to private evidence, constrains how value can move, and records the result as portable reputation. The human buyer remains the final release authority.

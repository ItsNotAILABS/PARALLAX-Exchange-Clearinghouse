# PARALLAX Multi-Model Agents

PARALLAX now has a bounded multi-model / multi-agent runtime for commercial-alpha paper and testnet workflows.

## Model roles

- `model.feeder_classifier` classifies upstream repo artifacts.
- `model.risk_gatekeeper` scores actions for policy and approval risk.
- `model.execution_router` selects paper/testnet routes.
- `model.receipt_writer` creates deterministic proof payloads.
- `model.market_sentinel` normalizes market signals.
- `model.governance_notary` prepares SNS/token governance records.

## Agents

- `Mercator` reads market signals.
- `Custos` guards policy and boundary.
- `Ordinator` routes workflows.
- `Probator` prepares proof room checks.
- `Scriptor` writes receipts.
- `Foederator` ingests feeder repos.
- `Notarius` prepares governance notary records.
- `Executor` submits paper/testnet actions only.

## Routes

```text
paper signal -> Mercator -> Custos -> Ordinator -> Probator -> Executor -> Scriptor
feeder repo  -> Foederator -> Custos -> Scriptor
SNS proposal -> Notarius -> Custos -> Scriptor
```

## Boundary

This runtime does not enable live broker execution, custody, regulated exchange activity, public mainnet bridge behavior, token sales, or autonomous live trading. `restricted_live` is blocked before execution.

## Commands

```bash
pnpm multi:agents
pnpm alpha:models
```

## Product meaning

This is the first explicit multi-model operating lane in PARALLAX: multiple model roles feed multiple agents, and agents produce traceable, hash-backed runs. It is designed to connect the Clearinghouse authority repo, HFT feeder repo, SNS governance repo, MatDaemon model backend, and the existing Latin trading engines without collapsing those systems into one unsafe path.

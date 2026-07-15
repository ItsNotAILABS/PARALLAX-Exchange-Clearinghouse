# PARALLAX Model Training Runway

This runway turns the multi-repo federation into governed model-training material.

It does not claim that an external model has been fine-tuned yet. It creates the dataset contract, seed examples, builder, validator, and receipt layer needed before model training.

## Source files

```text
config/federation/parallax.repo-federation.json
config/use-cases/parallax.use-cases.json
config/training/parallax.model-training.manifest.json
datasets/training/parallax.federation.training.jsonl
```

## Model families

| Model | Purpose |
|---|---|
| `parallax.feeder_classifier` | Classifies feeder material as public-safe, private-summary, review-required, internal-only, or blocked. |
| `parallax.risk_gatekeeper` | Evaluates agent commands, HFT signals, cloud exports, and connector actions against alpha policy. |
| `parallax.execution_router` | Routes approved use cases to AI Execution, Trade, Research Mint, Proof Room, Control Tower, Native Interface, or Governance. |
| `parallax.receipt_writer` | Converts approved paper/testnet events and feeder classifications into receipt-ready records. |

## Training commands

```bash
pnpm training:build
pnpm training:validate
pnpm alpha:models
```

`training:build` writes:

```text
dist/training/parallax-training-dataset.jsonl
dist/training/parallax-training-receipt.json
```

## Training record shape

```json
{
  "id": "train-paper-order-001",
  "model": "parallax.risk_gatekeeper",
  "input": {
    "repo": "ItsNotAILABS/PARRALAX-AIHFTFUND",
    "lane": "hft_signal_and_strategy",
    "commandKind": "order",
    "mode": "paper"
  },
  "expected": {
    "classification": "public_safe",
    "policyDecision": "allowed",
    "decision": "approved_paper",
    "receiptRequired": true
  }
}
```

## What the models should learn

The models should learn operational judgment, not hype:

1. Which repo lane a signal came from.
2. Whether the material is public-safe, private-summary, review-required, internal-only, or blocked.
3. Which PARALLAX surface owns the next action.
4. Whether a paper/testnet action can proceed.
5. Whether human approval is required.
6. Which receipt type must be produced.
7. Which unsafe claims or actions must be rejected.

## Hard boundaries

The training set must not teach models to:

- route live broker orders,
- move live money,
- claim custody,
- expose secrets,
- export private memory,
- claim performance guarantees,
- claim legal ownership from a receipt/hash,
- bypass operator approval,
- treat feeder repo material as authority without classification.

## Next maturity step

The next step is `Feeder Ingestion Pass 1`:

```text
read feeder manifests
  -> collect candidate artifacts
  -> classify into training records
  -> attach source commit/path/hash
  -> create integration PR into authority repo
  -> emit receipt
```

Until that pass exists, this is a seeded governed training pipeline, not continuous training automation.

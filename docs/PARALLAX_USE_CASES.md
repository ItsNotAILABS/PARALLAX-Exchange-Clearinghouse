# PARALLAX Use Cases

PARALLAX use cases are not marketing examples. They are routed operating stories that can be evaluated, simulated, receipt-backed, and converted into model-training records.

Source of truth:

```text
config/use-cases/parallax.use-cases.json
```

## Current use-case pack

| Use case | Feeder lane | Primary model | Product surfaces |
|---|---|---|---|
| Autonomous paper trading signal to order | `hft_signal_and_strategy` | `parallax.execution_router` | AI Execution, Trade, Proof Room |
| HFT signal approval loop | `hft_signal_and_strategy` | `parallax.risk_gatekeeper` | AI Execution, Native Interface, Proof Room |
| Research artifact minting | `memory_and_product_surface` | `parallax.research_mint_classifier` | Research Mint, Proof Room, Governance |
| Private sovereign proof room | `native_protocol_substrate` | `parallax.boundary_classifier` | Private Blockchain Clouds, Proof Room, Governance |
| MCP feeder ingestion | `federation_mcp_control_plane` | `parallax.feeder_classifier` | Control Tower, Cloudflare Edge Gateway, Federation Registry |
| Phantom simulation and compute credit | `phantom_simulation_and_sdk` | `parallax.simulation_receipt_model` | Compute-Bound Strategy Runner, Research Mint, Proof Room |

## Working loop

```text
feeder repo signal
  -> feeder manifest / source commit
  -> use-case classification
  -> model-family route
  -> policy decision
  -> paper/testnet action or rejection
  -> receipt/proof-room record
  -> training example
```

## Boundary

Use cases are alpha-safe by design:

- no live money movement,
- no live broker execution,
- no custody,
- no public mainnet bridge,
- no raw private-memory export,
- no secrets in training datasets,
- no unsupported performance claims.

## Operator command

```bash
pnpm usecases:validate
pnpm training:build
pnpm training:validate
pnpm alpha:models
```

`training:build` produces:

```text
dist/training/parallax-training-dataset.jsonl
dist/training/parallax-training-receipt.json
```

The receipt records model families, label counts, source files, output hash, and boundary rules.

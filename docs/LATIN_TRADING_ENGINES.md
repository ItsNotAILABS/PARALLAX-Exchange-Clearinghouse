# Native Latin Trading Engines

PARALLAX now has a native Latin engine layer inside `@parallax/ai-wallet`.

## Engines

| Engine | Role |
|---|---|
| `PRESSURA` | Signal pressure and confidence sensing. |
| `LIMES` | Paper/testnet/live boundary gate. |
| `ASCENSUS` | Freshness/depth review gate. |
| `GLACIES` | Notional and policy hardening gate. |
| `GRANDINIS` | Receipt/proof requirement. |
| `FLUMEN` | Workflow route availability. |
| `SOLUM` | Grounded price/execution reality check. |
| `FULMEN` | Final agent output authorization. |

## Agents

| Agent | Role |
|---|---|
| `Mercator` | Reads market signal. |
| `Custos` | Guards policy and boundary. |
| `Probator` | Prepares proof/receipt route. |
| `Executor` | Submits approved paper order. |

## Workflow

```text
market signal
  -> PRESSURA / LIMES / ASCENSUS / GLACIES
  -> GRANDINIS / FLUMEN / SOLUM / FULMEN
  -> Mercator / Custos / Probator / Executor
  -> policy-gated paper order
  -> receipt + IDE summary
```

## Boundary

This is a paper/testnet-first automation layer. `live` and `restricted_live` modes are blocked before order execution.

## Validation

```bash
pnpm ai-wallet:test
pnpm alpha:wallet
```

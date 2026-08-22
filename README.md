# PARALLAX Exchange Clearinghouse

**Machine-checkable netting, margin, settlement planning and ledger-evidence infrastructure for PARRALAX.**

The Clearinghouse is the post-execution accounting and settlement plane. It accepts normalized trade/execution records, validates them, computes net obligations, evaluates margin/settlement state and produces receipt-linked ledger snapshots.

```text
PARRALAX executions
       │
       ▼
trade validation
       │
       ▼
netting + margin
       │
       ▼
settlement plan
       │
       ▼
ledger snapshot + receipts
       │
       ▼
audit / reconciliation / external settlement adapter
```

## NEXUS federation

Declaration: [`ecosystem.surface.json`](ecosystem.surface.json).

Primary actions:

```text
clearing.trade_validate
clearing.net
clearing.margin_evaluate
clearing.settlement_plan
clearing.receipt_verify
clearing.ledger_snapshot
```

The clearing plane consumes NEXUS task, policy, approval, artifact and execution-receipt objects and returns machine-checkable artifacts/receipts for the next accounting or settlement step.

## Netting model

A normalized clearing item should preserve fields such as:

```text
trade/execution ID
account / legal entity
instrument
side
quantity
price / valuation reference
currency
fees
counterparty / venue reference
trade timestamp
settlement date
source receipt hash
```

Netting groups should have a deterministic grouping key and a reproducible calculation path so the same input set produces the same obligation set.

## Settlement workflow

```text
validated executions
 -> deduplicate / idempotency check
 -> group by clearing key
 -> calculate gross obligations
 -> calculate net obligations
 -> evaluate collateral/margin rules
 -> create settlement plan
 -> approval where required
 -> external/internal settlement adapter
 -> ledger acknowledgement
 -> reconciliation
 -> final receipt
```

## Reconciliation

A production clearing cycle should reconcile three independent views:

```text
execution receipts
internal clearing/ledger state
external counterparty/rail acknowledgement
```

Differences should become explicit exceptions rather than silent balance adjustments.

## Operating controls

```text
[ ] immutable execution IDs
[ ] idempotent ingest
[ ] deterministic netting groups
[ ] explicit valuation source/time
[ ] margin/collateral rule version
[ ] approval state for irreversible settlement
[ ] balanced ledger journal
[ ] settlement acknowledgement
[ ] exception/reconciliation report
[ ] artifact + receipt hashes
```

## PARRALAX relationship

[PARRALAX](https://github.com/ItsNotAILABS/PARRALAX-AIHFTFUND) owns strategy, risk and execution planning. This repository owns clearing/netting/settlement evidence.

```text
PARRALAX
 execution / wallet / risk
       │
       ▼
PARALLAX Clearinghouse
 netting / margin / settlement / reconciliation
```

## NEXUS validation

After changing the federation surface:

```bash
# from ItsNotAILABS/nexus
python tools/validate_ecosystem_protocols.py
python tools/validate_ecosystem_registry.py
python tools/production_gate.py
```

## Production integration

Use a dedicated adapter for each external settlement/ledger rail and keep adapter acknowledgements as artifacts linked to the original execution/clearing request. The generic clearing contract should not require a particular exchange, bank, blockchain or custodian.

## Ecosystem

- [PARRALAX](https://github.com/ItsNotAILABS/PARRALAX-AIHFTFUND) — market execution/risk
- [NEXUS](https://github.com/ItsNotAILABS/nexus) — protocol and handoff authority
- [POCKET](https://github.com/ItsNotAILABS/pocket) — identity/tenant/policy host
- [Medina Memory](https://github.com/ItsNotAILABS/MedinaMemorySystems) — durable incident/reconciliation outcomes

The Clearinghouse exists to make the post-trade side as inspectable as execution: **validate, net, settle, reconcile, receipt.**

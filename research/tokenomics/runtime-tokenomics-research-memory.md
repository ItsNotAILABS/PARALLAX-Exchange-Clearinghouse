# Runtime Tokenomics Research Memory

## Purpose

This research-memory note links PARALLAX tokenomics to the Medina runtime work stack: Medina Tool Interface, Aegis / Medina Sandbox Gateway, MESIE Virtual Processor, Protocol Server Suite, Wasm Kernel Lane, Julia/Python compute lanes, QWorkers, Nova registry, publication-chain packets, and receipt-first research surfaces.

## Research thesis

The next PARALLAX tokenomics update is not a public-token launch. It is a runtime-accounting model for measurable AI work.

A governed runtime event can become an accounting event only after it produces a receipt. The receipt is the bridge between computation and tokenomics.

```text
work call -> governance -> execution/artifact -> measured output -> receipt -> hash chain -> local accounting
```

## Native units

- `PXBYTE`: measured artifact/work-output byte accounting.
- `PXNOVA`: measured local runtime-cycle accounting.
- `PXRCPT`: validated proof/receipt accounting.
- `PXTEAM`: team artifact-lane accounting.

These are internal, paper-mode accounting units. They should remain claim-bounded until live legal, security, compliance, ICP/SNS, and hosted deployment gates exist.

## Why this belongs in PARALLAX

The PARALLAX README already frames the product as AI-native financial infrastructure for multi-ledger agents, token economics, trading, clearing, settlement receipts, and governed edge execution. The runtime-tokenomics lane makes that measurable without overclaiming live regulated activity.

## System boundary

Current posture:

- paper/testnet/internal-credit first,
- receipt-backed proof flows first,
- live money movement and regulated activity gated,
- public language must avoid live fund/broker/exchange/custody claims.

## Next adapter build

The implementation adapter should expose:

```text
POST /v1/runtime-tokenomics/account
GET  /v1/runtime-tokenomics/classes
GET  /v1/runtime-tokenomics/loops
GET  /v1/runtime-tokenomics/receipts/:id
```

The first production test should refuse minting when `receipt_exists` is false.

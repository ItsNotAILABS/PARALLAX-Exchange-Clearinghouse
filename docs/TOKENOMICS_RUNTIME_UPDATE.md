# PARALLAX Runtime Tokenomics Update

**Status:** additive proposal / implementation lane  
**Target repo:** `ItsNotAILABS/PARALLAX-Exchange-Clearinghouse`  
**Public posture:** paper, testnet, internal-credit, receipt-first  
**Do not use as:** public sale, yield promise, live broker/market claim, custody claim, or mainnet-value claim

## Why this update exists

PARALLAX already contains an agent-tokenomics source of truth at:

```text
config/tokenomics/parallax.agent-tokenomics.json
```

The next system update is to connect that tokenomics layer to the runtime work that has been built around Medina Tool Interface, Aegis / Medina Sandbox Gateway, MESIE Virtual Processor, QWorkers, governed sandbox execution, protocol servers, WebAssembly lanes, Julia/Python compute lanes, receipts, and research-memory packets.

This document does **not** replace the existing tokenomics file. It extends the system with a safe additive lane that can be validated before any live economic claim is made.

## Current token classes

The existing tokenomics registry already defines:

| Symbol | Role | Current mode |
|---|---|---|
| `PXUSD` | paper stable accounting unit | paper |
| `PXICP` | ICP test unit | testnet |
| `PXETH` | EVM test unit | testnet |
| `PXAI` | agent work credit | paper |
| `PXGPU` | compute credit | paper |
| `PXCRED` | receipt credit | paper |

## Runtime extension: why tokens now matter

The runtime now has measurable event types:

- governed AI work calls,
- sandbox execution jobs,
- protocol server calls,
- QWorker task lanes,
- research artifact ingestion,
- proof/receipt generation,
- compute-lane runs in Python, Julia, Node, and WebAssembly,
- publication and research-memory packet creation.

These events produce measurable primitives:

- bytes processed,
- runtime milliseconds,
- exit codes,
- stdout/stderr,
- parsed output,
- governance decision,
- governance score,
- route / lane / worker identity,
- artifact hash,
- receipt hash,
- chain position.

The tokenomics system should treat these as **local accounting inputs** first, not as public financial assets.

## Proposed additive runtime token classes

| Symbol | Name | Class | Mode | Purpose |
|---|---|---|---|---|
| `PXBYTE` | PARALLAX Byte Unit | byte_accounting_unit | paper | Internal accounting for measured artifact bytes and work-output bytes. |
| `PXNOVA` | PARALLAX NOVA Cycle | runtime_cycle_unit | paper | Internal accounting for measured local runtime cycles and orchestration effort. |
| `PXRCPT` | PARALLAX Receipt Unit | proof_receipt_unit | paper | Internal accounting for validated receipts and hash-chain proof events. |
| `PXTEAM` | PARALLAX Team Lane Credit | team_lane_credit | paper | Internal team workspace accounting for shared artifact lanes and approved QWorker work. |

These are proposed as internal accounting units only. They should not be marketed as cash, securities, redeemable units, or investment instruments.

## Mint / burn gates

A runtime token mint is valid only when all required gates pass:

```text
receipt_exists
artifact_hash_present
claim_boundary_passed
operator_policy_allows
no_live_value_claim
ledger_append_success
```

A runtime compute burn is valid only when:

```text
compute_budget_available
execution_receipt_emitted
runtime_lane_allowed
no_external_capacity_claim_without_evidence
```

## Runtime accounting loop

```text
Work call
-> governance precheck
-> execution or artifact operation
-> measurable output
-> receipt emission
-> hash-chain append
-> local accounting update
-> research-memory / proof export
```

## Integration points

| System | Integration |
|---|---|
| Medina Tool Interface | exposes governed tool calls and execution endpoints |
| Aegis Sandbox Gateway | executes sandbox jobs and returns receipts |
| MESIE Virtual Processor | scores bytes, entropy, coherence, route, and runtime evidence |
| QWorkers | routes work lanes by worker identity and skill domain |
| ARGOS / Proof Room | stores receipts and hash-chain state |
| Cloudflare Edge Gateway | exposes read-only or gated token/ledger surfaces |
| ICP / SNS | future notarization or governance lane only after explicit gate |

## Production claim boundary

Safe public language:

> PARALLAX uses paper/testnet/internal-credit tokenomics to measure AI-agent work, compute, research artifacts, and receipt-backed execution events before any live economic or regulated activity.

Unsafe public language:

- `PXAI has market value.`
- `PXBYTE is money.`
- `PXNOVA is redeemable.`
- `PXGPU guarantees access to external hardware.`
- `PXCRED is a security or wage.`
- `PARALLAX is a live fund, broker, exchange, bank, custodian, or money transmitter.`

## Next implementation steps

1. Add the additive registry file: `config/tokenomics/parallax.runtime-tokenomics.v0.2.json`.
2. Build a receipt-to-accounting adapter.
3. Add `/v1/runtime-tokenomics` to the Cloudflare gateway.
4. Add tests for mint/burn refusal when receipts are missing.
5. Add a proof-room export for runtime accounting events.
6. Only after live credentials and legal/security gates, decide whether any part belongs in ICP/SNS governance.

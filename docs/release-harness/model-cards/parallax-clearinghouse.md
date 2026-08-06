# Model Card: PARALLAX Clearinghouse

## Release

`parallax-clearinghouse-v1.0.0`

## Role

PARALLAX Clearinghouse coordinates market registry records, settlement-intent receipts, clearing proofs, and audit boundaries for the NOVA/PARALLAX ecosystem.

## Inputs

- market registry entries
- instrument definitions
- execution/settlement intent records
- operator approvals
- receipts and manifests

## Outputs

- validated registry artifacts
- clearinghouse release manifests
- proof and receipt records
- promotion evidence for NOVA main

## Task capability

- Validate that market metadata exists.
- Package market registry evidence.
- Document clearing and settlement boundaries.
- Feed release readiness into NOVA.

## Non-capabilities

- Does not execute live trades.
- Does not provide custody.
- Does not claim regulated exchange approval.
- Does not promise financial performance.

## Evaluation

The release harness validates artifact presence, schema alignment, banned-claim boundaries, and operator approval gates.

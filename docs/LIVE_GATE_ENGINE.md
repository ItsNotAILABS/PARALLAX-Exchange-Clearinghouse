# PARALLAX Live Gate Engine

PARALLAX now has a live-gate engine for regulated-live readiness. It does not enable live execution. It makes the missing evidence explicit, builds approval packets, and routes safe simulations through paper/testnet rails.

## Safe endpoints

```text
GET  /api/live/gate
POST /api/live/approval-packet
GET  /api/brokers/adapters
POST /api/brokers/paper-order
POST /api/token-rails/proposal
```

## Denied endpoints

```text
POST /api/brokers/execute
POST /api/live/execute
POST /api/live-money/transfer
POST /api/token-sale
POST /api/token-rails/live-transfer
```

Denied routes return `regulated_live_gate_required`.

## Required evidence gates

```text
legal_entity_verified
kyc_aml_program
broker_terms_review
licensed_operator_attestation
compliance_officer_attestation
production_secret_provider_bound
risk_limits_approved
human_approval_workflow
kill_switch_enabled
audit_log_enabled
receipt_chain_enabled
daily_reconciliation_job
incident_response_runbook
```

## Secret handling

The engine registers secret references only. It does not store raw secrets, private keys, seed phrases, broker passwords, or custody keys.

## Broker execution

Broker connectors are adapter contracts for paper/sandbox mode. They support paper order proposals and receipts. Live order submission stays denied until the live gate is satisfied outside alpha.

## Internal token movement

Internal-token rails support testnet/internal-credit proposals only. They do not create redeemability, yield, deposits, security-token offerings, cash equivalents, or public-mainnet value movement.

## Product path

This creates a sellable readiness package: broker onboarding map, secret-provider map, approval packet, paper execution receipts, internal-token simulation, and compliance evidence inventory.
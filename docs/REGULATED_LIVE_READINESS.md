# PARALLAX Regulated Live Readiness

PARALLAX can prepare for secrets, broker execution, and internal-token settlement without enabling live regulated activity in the alpha platform.

## Position

The current platform is still paper/testnet. This layer adds readiness contracts for future regulated live operation.

It does not enable:

- custody
- raw private-key storage
- seed phrase capture
- live broker order submission
- live money movement
- token sale behavior
- redeemability/yield claims
- public mainnet bridge execution

## New safe capabilities

```text
POST /api/secrets
GET  /api/secrets
POST /api/brokers
GET  /api/brokers
POST /api/brokers/paper-order
POST /api/token-rails
GET  /api/token-rails
GET  /api/regulated-live
```

These endpoints register references, connectors, paper/sandbox proposals, and internal credit/testnet rails. They do not store raw secrets or execute live money movement.

## Explicit denial routes

```text
POST /api/brokers/execute
POST /api/token-rails/live-transfer
POST /api/live/execute
POST /api/live-money/transfer
POST /api/token-sale
```

These return:

```json
{
  "error": "regulated_live_gate_required",
  "posture": "regulated_live_disabled_until_approved"
}
```

## Secrets and keys

Secrets are represented as references only.

Allowed shape:

```json
{
  "provider": "cloudflare_secrets",
  "secretRef": "BROKER_ALPACA_SANDBOX_KEY",
  "scope": "broker",
  "type": "broker_api_key_ref"
}
```

Forbidden:

- raw broker passwords
- raw API secrets
- private keys
- seed phrases
- custody keys

## Broker connector readiness

Supported broker families are adapter contracts only:

```text
alpaca_sandbox
interactive_brokers_paper
tradier_sandbox
schwab_developer_sandbox
tastytrade_sandbox
coinbase_sandbox
kraken_sandbox
binance_testnet
oanda_practice
mt5_demo_bridge
```

A broker connector can read account-style metadata, hold secret references, propose sandbox/paper orders, and write receipts. Live order submission is disabled until the regulated live gate is complete.

## Internal token rails

Internal tokens remain internal credit or testnet rails only:

```text
PXUSD
PXAI
PXCRED
PXGPU
PXRCPT
```

Disabled claims:

- redeemable cash
- yield
- deposit account
- security token sale
- public mainnet value transfer

## Required future activation gates

Live activation requires all of the following before any future code path should execute real money or broker orders:

```text
REGULATED_LIVE_APPROVED=true
production secret provider bound
broker contract signed
licensed operator attestation
compliance officer attestation
legal entity verified
KYC/AML program
risk limits approved
human approval workflow
kill switch enabled
audit log enabled
receipt chain enabled
incident response runbook
daily reconciliation job
manual kill switch tested
```

## Business path

This creates a monetizable readiness lane without crossing the live boundary:

- Secret reference management
- Broker connector marketplace
- Sandbox/paper execution APIs
- Internal token rail simulations
- Compliance evidence packets
- Regulated live readiness packages for future enterprise clients

## Marketing-safe language

PARALLAX provides a governed Agent Vault platform for AI-agent teams. It supports secret references, sandbox broker connectors, internal credit/testnet token rails, paper execution workflows, policy gates, and chained receipts. Live brokerage, custody, private-key handling, live money movement, token sales, and public mainnet bridge execution remain disabled until future regulated approvals are complete.

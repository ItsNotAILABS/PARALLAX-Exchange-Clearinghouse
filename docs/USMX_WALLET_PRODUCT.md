# PARALLAX US/MX Wallet Product

## Purpose

This is the production-shaped wallet and currency-changing product layer for the United States / Mexico corridor.

It is designed to be usable as a real product surface once a regulated payment, FX, wallet, banking-as-a-service, or remittance partner is connected. The code does not pretend PARALLAX itself is a bank, custodian, money transmitter, or regulated remittance provider.

## Product flow

```text
customer created
-> wallet opened
-> provider funding session created
-> provider/webhook funding confirmation
-> USD credited to wallet ledger
-> USD/MXN FX order quoted
-> provider FX quote locked
-> quote executed
-> USD debited / MXN credited
-> MXN payout instruction created through provider adapter
-> receipt chain appended
-> reconciliation snapshot exported
```

## Runtime files

```text
apps/us-mexico-wallet-fx/src/index.js      paper/testnet wallet and FX primitive
apps/us-mexico-wallet-fx/src/product.js    provider-backed product layer
scripts/validate-usmx-wallet-product.mjs   production product smoke validator
```

## Product API primitives

The product layer exports:

```text
createCustomer(input)
openProductWallet(input, store)
requestFunding(input, store, adapter)
confirmFunding(input, store)
createFxOrder(input, store, adapter)
executeFxOrder(input, store, adapter)
buildProductionReadiness(input)
runProductSmokeTest()
```

## Provider adapter contract

A production provider must supply or support:

```text
customer_identity_verification
usd_funding_source
mxn_payout_destination
fx_quote_lock
webhook_or_reconciliation_event
refund_or_reversal_path
ledger_export
```

The current adapter is intentionally interface-shaped. It can run in sandbox mode now. Live mode requires a real provider adapter with provider credentials, webhook verification, reconciliation, refund/reversal handling, and legal/compliance signoff.

## Required secrets for live provider mode

```text
USMX_PROVIDER_API_KEY
USMX_PROVIDER_WEBHOOK_SECRET
USMX_LEDGER_SIGNING_SECRET
```

Secrets must live in the deployment secret store, not source code.

## Readiness gate

Run:

```bash
pnpm usmx:product:validate
```

Output:

```text
dist/usmx-wallet-product/validation-receipt.json
```

The readiness gate returns:

```text
not_live_ready
```

unless all are present:

```text
provider capabilities
deployment secrets
KYC/AML program
sanctions screening
consumer disclosures
complaint process
reconciliation runbook
licensed partner or legal memo
```

When those are present, the gate returns:

```text
live_ready_with_provider
```

That does not mean PARALLAX itself becomes a bank or money transmitter. It means the product layer is ready to operate through the approved provider/legal path.

## What is actually workable now

The current product can run a full sandbox lifecycle:

```text
create customer
open wallet
create funding session
confirm funding event
quote USD -> MXN
execute FX order
create MXN payout instruction
append receipt chain
export state snapshot
```

## What is blocked until provider/legal setup

```text
live customer funding
live FX execution
live MXN payout
regulated remittance claim
custody claim
bank claim
money transmitter claim without license or partner
```

## Test command

```bash
pnpm usmx:product:validate
```

This runs the full product smoke test and writes a receipt.

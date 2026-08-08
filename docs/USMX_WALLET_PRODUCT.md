# PARALLAX US/MX Wallet Product

## Purpose

This is the production-shaped wallet, card-rail, FX-intent, and receipt product layer for the United States / Mexico corridor.

The updated product model is not an old-school stored-value wallet. The strongest path is non-custodial orchestration: the customer authorizes a tokenized debit-card transaction, the approved card/payment provider executes the card-network and FX movement, and PARALLAX records consent, intent, quote, provider references, reconciliation evidence, and blockchain-grade receipts.

PARALLAX does not hold customer funds, store raw card numbers, store CVV, claim to be a bank, or claim independent money-transmitter/remittance authority without the licensed provider/legal path.

## Product flow: provider-executed debit-card rail

```text
customer created
-> customer KYC / sanctions status recorded from provider
-> source debit card token received from provider-hosted capture
-> destination debit card token received from provider-hosted capture
-> user consent captured
-> card rail intent created
-> provider FX quote locked
-> provider debit-card authorization created
-> provider card-network push / OCT instruction created
-> provider webhook / reconciliation event confirms status
-> PARALLAX event-chain receipt appended
-> Motoko ICP audit canister can anchor receipt
-> Solidity receipt registry can anchor receipt
-> clearing packet exported
```

## Legacy wallet-compatible flow

The product still supports the earlier sandbox wallet lifecycle for internal testing:

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

This path remains useful for tests and ledgers, but the preferred production posture is provider-executed card rail with no PARALLAX custody.

## Runtime files

```text
apps/us-mexico-wallet-fx/src/index.js      paper/testnet wallet and FX primitive
apps/us-mexico-wallet-fx/src/product.js    non-custodial provider/card-rail product layer
scripts/validate-usmx-wallet-product.mjs   production product smoke validator
canisters/usmx-card-rail-audit/src/main.mo Motoko ICP receipt audit canister
contracts/USMXCardRailReceiptRegistry.sol  Solidity receipt registry
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
createCardRailIntent(input, store, adapter)
executeCardRailFx(input, store, adapter)
buildCardRailClearingPacket(input, store)
buildProductionReadiness(input)
runProductSmokeTest()
```

## Provider adapter contract

A production provider must supply or support:

```text
customer_identity_verification
tokenized_debit_card_authorization
cardholder_authentication_3ds_or_equivalent
card_network_push_to_card_or_original_credit_transaction
usd_funding_source
mxn_payout_destination
fx_quote_lock
provider_side_funds_flow
webhook_or_reconciliation_event
refund_or_reversal_path
ledger_export
```

The current adapter is intentionally interface-shaped. It can run in sandbox mode now. Live mode requires a real provider adapter with provider credentials, webhook verification, reconciliation, refund/reversal handling, card-network rules review, PCI/provider-hosted capture scope, and legal/compliance signoff.

## Required secrets for live provider mode

```text
USMX_PROVIDER_API_KEY
USMX_PROVIDER_WEBHOOK_SECRET
USMX_LEDGER_SIGNING_SECRET
```

Secrets must live in the deployment secret store, not source code.

## Non-custody boundaries

```text
PARALLAX custody: false
PARALLAX customer funds held: false
raw PAN storage: false
CVV storage: false
settlement authority: provider only
provider-hosted card capture: required for live mode
3DS / equivalent cardholder auth: required for live mode
reversal / refund path: provider required
```

This is the core change: PARALLAX becomes the intent, policy, receipt, and coordination layer around licensed provider execution rather than the entity moving or holding the money itself.

## Blockchain-language surfaces

### Motoko / ICP

`canisters/usmx-card-rail-audit/src/main.mo` anchors receipt metadata on an ICP canister. It records sequence, corridor, provider, intent ID, execution ID, receipt hash, previous hash, event head, and the non-custody flag.

### Solidity / EVM

`contracts/USMXCardRailReceiptRegistry.sol` anchors the same kind of receipt chain on EVM-compatible networks. It rejects custody-enabled anchors and enforces previous-hash continuity.

Neither contract moves funds. They are proof and audit surfaces only.

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
card network rules review
PCI scope attestation or provider-hosted capture evidence
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
create non-custodial card-rail intent
simulate provider debit-card authorization
simulate provider push-to-card / OCT instruction
append receipt chain
build card-rail clearing packet
export state snapshot
validate Motoko / Solidity receipt registry surfaces
```

## What is blocked until provider/legal setup

```text
live debit-card authorization
live card-network push-to-card
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
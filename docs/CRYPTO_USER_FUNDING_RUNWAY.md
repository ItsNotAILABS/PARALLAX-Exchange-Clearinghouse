# PARALLAX Crypto User Funding Runway

This document defines the real-access runway for letting users fund purchase intents with crypto while keeping PARALLAX inside explicit legal, custody, operator, and receipt boundaries.

The objective is not to pretend PARALLAX is already a bank, custodian, exchange, or regulated payment institution. The objective is to add the correct rails so users can bring value into purchase workflows through external providers, wallet transfers, or sandbox/testnet rails, while PARALLAX records the consent, funding intent, confirmation, authorization, purchase receipt, and proof-room evidence.

```text
user purchase intent
  -> quote and disclosures
  -> user consent
  -> crypto funding intent
  -> external provider / wallet transfer reference
  -> transaction or webhook observation
  -> confirmation and risk review
  -> balance credit proposal
  -> purchase authorization
  -> purchase receipt
  -> proof-room append
```

---

## Product meaning

PARALLAX can now model user-funded purchases through:

| Rail | Meaning | Current posture |
|---|---|---:|
| External checkout/onramp provider | Third-party payment/onramp processor creates the user payment session and provider reference | Integration-ready |
| Self-custody wallet transfer | User sends crypto from their own wallet to an operator-approved receiving rail or provider-managed address | Gated |
| Sandbox exchange or testnet | Non-live test path for exchange, chain, and purchase demos | Active alpha |
| Internal credit | Confirmed funding can propose internal purchase credit after policy review | Receipt-gated |

The core runtime surface is:

```text
apps/crypto-funding-gateway/src/index.js
```

The source-of-truth configuration is:

```text
config/crypto/parallax.crypto-user-funding.json
```

---

## What this enables

This adds real architecture for:

- user purchase intents,
- external provider session references,
- wallet-transfer references,
- crypto transaction hashes,
- confirmations,
- KYC/AML review thresholds,
- operator approval thresholds,
- balance credit proposals,
- purchase authorization receipts,
- refund/reversal receipt paths,
- proof-room append requirements.

This is the first necessary step before live user-funded purchases. It gives the system contracts and receipts instead of loose payment notes.

---

## What remains blocked

PARALLAX still does **not** enable by default:

```text
custody
raw private-key storage
seed phrase capture
raw provider secret storage
FDIC or bank-account claims
yield or redeemability claims
autonomous live purchases without approval
public token sale
regulated exchange activity
```

No private key, seed phrase, API key, webhook secret, or treasury wallet secret should be committed. Provider credentials must remain external secret references only.

---

## Funding intent contract

A funding intent represents a user's decision to fund a specific purchase.

```json
{
  "userId": "user_001",
  "vaultId": "vault_user_001",
  "purchaseId": "purchase_001",
  "amountUsd": 250,
  "assetClass": "stablecoin",
  "chain": "base",
  "mode": "external_checkout_provider",
  "userConsent": [
    "asset_and_chain_selected",
    "network_fee_disclosed",
    "refund_policy_disclosed",
    "purchase_terms_accepted",
    "risk_and_volatility_notice_acknowledged",
    "no_deposit_account_acknowledged"
  ],
  "providerSessionRef": "secret_or_provider_reference_only"
}
```

The runtime returns a receipt with:

```text
intent id
funding_pending status
custody false
provider session reference or receiving address reference
KYC/AML requirement
operator approval requirement
receipt hash
```

---

## Funding confirmation contract

A confirmation records that a provider webhook, chain watcher, exchange sandbox, or operator verifier observed funding.

```json
{
  "intentId": "cfi_abc123",
  "chain": "base",
  "txOrProviderRef": "tx_or_provider_reference",
  "confirmedAmountUsd": 250,
  "confirmations": 12,
  "providerStatus": "confirmed"
}
```

The receipt marks the status as either:

```text
funding_observed
funding_confirmed
```

Confirmed funding does not automatically execute a purchase. It proposes a balance credit and then requires purchase authorization.

---

## Purchase authorization contract

Purchase authorization checks whether the user has enough confirmed funding and whether review gates are satisfied.

```json
{
  "purchaseId": "purchase_001",
  "vaultId": "vault_user_001",
  "userId": "user_001",
  "amountUsd": 250,
  "availableFundingUsd": 250,
  "requestedMode": "paper_or_testnet_purchase",
  "kycAmlCleared": true,
  "operatorApproved": true,
  "liveGateApproved": false
}
```

The runtime returns either:

```text
approved_for_gated_purchase
requires_review_or_rejected
```

Automatic live execution remains false by default.

---

## Approval thresholds

Initial thresholds:

| Trigger | Threshold | Required action |
|---|---:|---|
| KYC/AML review | >= 1000 USD | Compliance review required |
| Operator approval | >= 2500 USD | Operator approval required |
| Live-mode request | any amount | Live gate approval required |
| Insufficient confirmed funding | any amount | Reject / collect funding |

These thresholds are not final legal advice. They are engineering guardrails until actual provider, legal, compliance, and operating policy are selected.

---

## API surface to expose next

The gateway runtime supports these service-level functions now:

```text
getCryptoFundingPolicy()
createFundingIntent(input)
recordFundingConfirmation(input)
evaluatePurchaseAuthorization(input)
```

The platform API should expose them as:

```text
GET  /api/crypto/funding/policy
POST /api/crypto/funding/intents
POST /api/crypto/funding/confirmations
POST /api/crypto/purchases/authorize
GET  /api/crypto/funding/receipts
```

---

## Provider adapter contract

A real provider adapter should implement:

```text
createSession(fundingIntent)
verifyWebhook(payload, signatureRef)
normalizeFundingEvent(providerEvent)
getTransferStatus(providerReference)
createRefundOrReversal(reference, reason)
```

Provider adapters must return normalized receipt payloads only. They must not leak secrets into logs, commits, client responses, or proof-room records.

---

## Deployment gates before live value

Before real user funds are accepted, complete:

```text
legal entity and terms review
provider contract review
KYC/AML/sanctions decision
refund and reversal policy
tax/accounting policy
wallet/treasury architecture review
security review
webhook verification
incident response plan
operator approval path
proof-room retention policy
```

The code is now prepared for real provider connection. The live switch remains a controlled deployment decision, not an accidental repo capability.

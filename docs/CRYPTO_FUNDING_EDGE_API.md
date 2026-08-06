# PARALLAX Crypto Funding Edge API

This document defines the Cloudflare-facing API bridge for governed crypto user funding and purchase authorization.

## Status

- Runtime: `apps/cloudflare-gateway/src/index.ts`
- Posture: `paper_testnet_first`
- Purchase execution: gated
- Custody: disabled by default
- Private keys / seed phrases: never accepted
- Provider secrets: external secret references only

## Edge routes

```text
GET  /v1/crypto/funding/policy
POST /v1/crypto/funding/intents
POST /v1/crypto/funding/confirmations
POST /v1/crypto/purchases/authorize
```

All mutation routes require:

```text
Authorization: Bearer $PARALLAX_EDGE_TOKEN
Content-Type: application/json
```

## Funding policy

```bash
curl -s "$PARALLAX_EDGE_URL/v1/crypto/funding/policy"
```

Returns supported chains, asset classes, provider modes, required consent terms, and denied capability paths.

## Create funding intent

```bash
curl -s "$PARALLAX_EDGE_URL/v1/crypto/funding/intents" \
  -H "authorization: Bearer $PARALLAX_EDGE_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "userId": "user_demo_001",
    "vaultId": "vault_demo_001",
    "purchaseId": "purchase_demo_001",
    "chain": "base",
    "assetClass": "stablecoin",
    "amountUsd": 250,
    "mode": "external_checkout_provider",
    "providerSessionRef": "stripe_or_coinbase_session_ref",
    "userConsent": [
      "asset_and_chain_selected",
      "network_fee_disclosed",
      "refund_policy_disclosed",
      "purchase_terms_accepted",
      "risk_and_volatility_notice_acknowledged",
      "no_deposit_account_acknowledged"
    ]
  }'
```

## Record funding confirmation

```bash
curl -s "$PARALLAX_EDGE_URL/v1/crypto/funding/confirmations" \
  -H "authorization: Bearer $PARALLAX_EDGE_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "intentId": "cfi_demo",
    "chain": "base",
    "txOrProviderRef": "provider_webhook_or_tx_ref",
    "confirmedAmountUsd": 250,
    "confirmations": 1,
    "providerStatus": "confirmed"
  }'
```

## Authorize purchase

```bash
curl -s "$PARALLAX_EDGE_URL/v1/crypto/purchases/authorize" \
  -H "authorization: Bearer $PARALLAX_EDGE_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "purchaseId": "purchase_demo_001",
    "vaultId": "vault_demo_001",
    "userId": "user_demo_001",
    "amountUsd": 250,
    "availableFundingUsd": 250,
    "requestedMode": "paper_or_testnet_purchase",
    "kycAmlCleared": false,
    "liveGateApproved": false
  }'
```

## Decision model

Funding intent can be created only when required consent is present and the chain, asset class, and mode are supported.

Funding confirmation proposes a balance credit only after provider status or chain confirmations indicate the funding is confirmed.

Purchase authorization succeeds only when confirmed user funding covers the purchase amount and higher-risk thresholds do not require missing KYC/AML or operator approvals.

Live-mode requests are blocked unless the live gate is explicitly approved. The repository does not claim bank, broker, exchange, custody, token sale, yield, or settlement authority.

## Provider adapter boundary

External providers can be attached behind these references:

- `providerSessionRef`
- `receivingAddressRef`
- `txOrProviderRef`

The edge API stores references and receipts, not private keys, seed phrases, or raw provider secrets.

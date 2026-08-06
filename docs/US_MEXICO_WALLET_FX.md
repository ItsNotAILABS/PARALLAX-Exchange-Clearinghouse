# PARALLAX US/Mexico Wallet FX

This module is a test-now wallet and currency-changing rail for the United States / Mexico corridor.

It supports USD and MXN wallet balances, quoted currency exchange, exchange acceptance, and receipt output. It is designed for paper/testnet validation first and does not claim to be a bank, money transmitter, exchange, custodian, or live remittance provider.

## Runtime

```text
apps/us-mexico-wallet-fx/src/index.js
```

## Validator

```bash
pnpm usmx:wallet:validate
```

The validator writes:

```text
dist/us-mexico-wallet-fx/validation-receipt.json
```

## Flow

```text
create wallet
-> disclose FX rate / spread / fee / paper-testnet posture
-> quote USD -> MXN or MXN -> USD
-> accept quote against available wallet balance
-> debit source currency
-> credit target currency
-> emit receipt hash
```

## Current test currencies

```text
USD
MXN
```

## Current corridors

```text
US_MX
MX_US
```

## Example local test

```bash
node scripts/validate-us-mexico-wallet-fx.mjs
```

Example programmatic use:

```js
import { POLICY, createWallet, quoteFx, acceptFxQuote } from './apps/us-mexico-wallet-fx/src/index.js';

const wallet = createWallet({
  ownerId: 'alfredo-demo',
  country: 'US',
  initialUsd: 500,
  initialMxn: 0
});

const quote = quoteFx({
  walletId: wallet.body.walletId,
  fromCurrency: 'USD',
  toCurrency: 'MXN',
  amount: 100,
  userConsent: POLICY.userConsentRequired
});

const accepted = acceptFxQuote({
  walletId: wallet.body.walletId,
  balances: wallet.body.balances,
  quote: quote.body
});

console.log({ wallet, quote, accepted });
```

## Policy boundaries

The module enforces these boundaries:

```text
No custody by default
No live money movement
No bank claim
No money transmitter claim
No autonomous settlement
Receipts required
User consent required before quoting
Operator review required above configured thresholds
```

## Why this matters

This gives PARALLAX a concrete wallet/currency-changing system that can be tested immediately without jumping into regulated live settlement too early. It can later be connected to provider sessions, banking partners, crypto rails, or licensed remittance providers once legal, compliance, KYC/AML, custody, sanctions screening, and production risk controls are satisfied.

## Next production bridge

The next layer should connect this paper/testnet runtime to the Cloudflare edge gateway routes:

```text
GET  /v1/wallet-fx/policy
POST /v1/wallets
POST /v1/fx/quote
POST /v1/fx/accept
GET  /v1/wallet-fx/demo
```

Then it should be connected to a real provider as an external secret reference only, not by storing raw private keys, seeds, bank credentials, or provider secrets in the repo.

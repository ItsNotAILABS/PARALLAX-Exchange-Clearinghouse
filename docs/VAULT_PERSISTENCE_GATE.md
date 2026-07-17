# PARALLAX Vault Persistence Gate

This gate hardens the Agent Vault product from process-local demo state into a canonical state contract that can run locally and map to Cloudflare storage.

## Why this exists

Agent Vaults are the jurisdictional boundary for external agent swarms. Wallets are execution organs inside the vault. Receipts are the evidence layer. That model fails if vault, wallet, and receipt state only lives inside a single process.

## Gate requirements

- durable canonical state
- authenticated principals and API keys
- enforceable spending limits
- human-approval thresholds before paper transfers
- cryptographic receipt chaining
- deterministic snapshot and recovery checks
- paper/testnet-only posture

## State adapters

`apps/agent-api/vault-state.js` defines two adapters:

- `mkMemoryStore()` for fallback testing.
- `mkKvStore()` for Cloudflare KV-compatible durable state through `env.PARALLAX_VAULT_STATE`.

The local server mounts a disk-backed KV adapter at:

```text
.parallax/vault-state.local.json
```

## API additions

```text
GET /api/snapshot
GET /api/recovery
```

`GET /api/snapshot` returns the deterministic recovery hash, counts, version, updated timestamp, and current receipt head.

`GET /api/recovery?hash=<recoveryHash>` checks whether the running state still resolves to the expected recovery hash.

## Principal authentication

The API accepts:

```text
Authorization: Bearer <api-key>
x-api-key: <api-key>
```

The local/demo principal is:

```text
pk_demo_operator
```

This is demo auth only. Production deployment must replace demo keys with a real key lifecycle, rotation, revocation, audit log, and tenant ownership registry.

## Spending controls

PXUSD transfers run through principal limits:

- daily paper spending cap
- human-approval threshold

If a request exceeds those gates, the API returns:

```text
daily_limit_exceeded
human_approval_required
```

## Receipt chain

Every governed event writes a receipt with:

- `prevReceiptHash`
- `receiptHash`
- `receiptHead`
- `principalId`
- `payloadHash`
- `boundary: paper_testnet_only`

## Validation

```bash
pnpm platform:validate
```

The validator emits:

```text
dist/platform/vault-persistence-gate-receipt.json
```

The gate requires state/auth/spend/receipt/recovery machinery to exist before the platform can pass `alpha:platform`.

## Boundary

This does not add custody, private-key handling, live brokerage, live money movement, public token sales, or public mainnet bridge execution.

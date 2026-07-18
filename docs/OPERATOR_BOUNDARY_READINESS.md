# PARALLAX Operator Boundary Readiness

This document defines the safe-use envelope for PARALLAX Agent Vaults before broader demo, marketing, Cloudflare Worker handoff, or external AI-agent integration.

## Required operator posture

PARALLAX is ready to use only inside this boundary:

- No custody
- No private keys
- No live broker execution
- No live money movement
- No token sale
- No public mainnet bridge
- Paper/testnet only

These claims are not marketing adjectives. They are runtime requirements.

## Machine-readable registry

The canonical registry is:

```text
config/platform/parallax.operator-boundaries.json
```

The registry contains:

- seven required boundaries
- disabled capabilities
- allowed capabilities
- a marketing-safe claim
- enforcement wording for each denied capability

## API readiness surface

The API exposes:

```text
GET /api/boundaries
```

This returns the current posture, disabled capabilities, allowed capabilities, and marketing-safe claim.

## Runtime denials

The worker blocks unsafe routes or capabilities before execution. Examples include paths containing:

```text
custody
private-key
seed
live-broker
broker/order
live-money
token-sale
yield
redeem
mainnet-bridge
```

Blocked requests return:

```json
{
  "error": "boundary_blocked",
  "posture": "paper_testnet_only"
}
```

## Allowed capabilities

The current safe operator surface is:

- create agent vault
- create paper wallet
- link outside wallet reference
- simulate paper transfer
- tick background agent
- write receipt
- read snapshot
- verify recovery

## Disabled capabilities

These are disabled until a future legal, security, compliance, governance, liquidity, and production audit gate exists:

- custody
- private key import
- seed phrase capture
- live broker order
- live money transfer
- token sale
- yield claim
- redemption claim
- public mainnet bridge

## Validation command

```bash
pnpm platform:validate
```

The validation command now emits:

```text
dist/platform/operator-boundary-readiness-receipt.json
```

That receipt fails if the codebase does not contain the boundary registry, `/api/boundaries`, `boundary_blocked`, denied capability terms, the persistence gate, principal/API-key auth, spend limits, receipt chaining, and recovery checks.

## Cloudflare handoff

For Cloudflare Worker handoff, bind durable state as:

```text
PARALLAX_VAULT_STATE
```

The platform can run in memory fallback for demo, but the serious operator posture is durable state plus explicit boundary denials.

## Marketing-safe statement

PARALLAX provides paper/testnet agent vaults, wallet-system orchestration, outside-wallet connector records, policy gates, and receipt evidence for external AI agents. It does not provide custody, private-key handling, live broker execution, live money movement, token sales, or public mainnet bridge execution.

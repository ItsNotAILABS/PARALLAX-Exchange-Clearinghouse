# PARALLAX Agent Execution Protocol

## Purpose

This protocol defines how an AI agent moves from intent to governed paper/testnet action and proof.

```text
intent -> command -> policy decision -> approved paper/testnet adapter -> receipt -> proof room -> IDE/operator view
```

## Hard alpha laws

1. Live mode is blocked by default.
2. Real money movement is not enabled.
3. Every command must be explicit JSON or typed object before evaluation.
4. Every evaluation emits a receipt.
5. Every receipt must chain to previous wallet/action receipts when available.
6. Human approval is required when policy thresholds are crossed.
7. Demo broker adapters are paper/demo only until readiness gates are complete.
8. PXCRED, PXAI, PXGPU, and PXUSD are internal/testnet accounting units in alpha.

## Policy domains

| Domain | Command kinds | Credits/assets | Gate |
|---|---|---|---|
| Paper trading | `order`, `cancel_order`, `approve_signal` | PXUSD, PXCRED | Edge + native policy gate |
| Research mint | `research_mint`, `operator_note` | PXAI, PXCRED | Research receipt + proof room |
| Internal settlement | `transfer` | PXAI, PXUSD, PXGPU, PXCRED | Counterparty and threshold gate |
| Compute runner | `transfer` with compute memo | PXGPU, PXCRED | Compute budget + benchmark receipt |
| HFT signal approval | `order`, `approve_signal`, `cancel_order` | PXUSD, PXCRED | Signal freshness/rate/risk/exposure gate |

## Full receipt fields

A mature receipt should include:

```json
{
  "receipt_id": "aiwrcpt_...",
  "kind": "AI_WALLET_COMMAND_APPROVED",
  "wallet_id": "aiw_...",
  "agent_id": "agent-hft-signal-alpha",
  "actor": "principal-parallax-agent-controller",
  "mode": "paper",
  "command_id": "aiwcmd_...",
  "decision": "approved",
  "reason_codes": ["VALID"],
  "policy_id": "parallax-ai-wallet-alpha-policy",
  "policy_version": "0.1.0-alpha.1",
  "payload_hash": "...",
  "previous_receipt_id": "aiwrcpt_...",
  "proof_room_id": "pxproof_...",
  "merkle_leaf": "...",
  "credits": [
    { "asset": "PXCRED", "amount": 1, "reason": "paper_order_receipt" }
  ],
  "created_at": "2026-07-11T00:00:00.000Z"
}
```

## Demo broker paper adapter path

```text
PARALLAX command
  -> policy approved for paper
  -> broker adapter translates command
  -> demo broker paper account receives order
  -> broker paper fill id is returned
  -> PARALLAX emits fill/settlement receipt
  -> PXCRED proof credit is minted internally
```

Adapter rules:

```text
No live API keys in alpha.
No live broker endpoints.
No external custody.
No order routing without PARALLAX receipt.
No command execution if policy decision is not approved.
```

## Future gated rails

Stablecoin-backed PXUSD, fiat/debit on-ramp, restricted-live execution, and live execution are architectural phases only until readiness gates pass.

Required future gates:

```text
legal review
custody model review
security review
compliance review
operator halt and rollback tests
observability and incident response
external audit or equivalent review
production deployment runbook approval
```

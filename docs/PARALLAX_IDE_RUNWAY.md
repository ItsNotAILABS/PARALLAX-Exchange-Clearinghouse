# PARALLAX IDE Runway

This document defines the IDE-facing execution surface for PARALLAX alpha.

The IDE is not a live trading terminal. It is a governed operator surface for building, previewing, evaluating, simulating, and receipt-linking agent commands before any external or live execution path exists.

## IDE promise

```text
Signal / research / compute / transfer intent
  -> AI wallet command
  -> edge policy precheck
  -> native C/C++ gate parity check
  -> paper/testnet execution adapter
  -> receipt
  -> proof room
  -> operator review
```

## IDE panes

| Pane | Purpose | Alpha boundary |
|---|---|---|
| Signal Console | Inspect HFT, portfolio, or research signals | Signals cannot self-execute live |
| Agent Wallets | Create deterministic paper/testnet AI wallets | No key custody, no real money movement |
| Policy Gate | Preview edge/native decisions and reason codes | Rejects live/restricted-live in alpha |
| Command Builder | Build JSON commands for order, transfer, research mint, compute | Commands are contracts before execution |
| Receipt Room | View receipt chain, payload hashes, Merkle leaves, credits | Receipt proofs do not imply financial performance |
| Broker Demo Adapter | Route approved paper commands to demo broker accounts later | Demo broker only; no live execution |
| Operator Controls | Pause, halt, approve, annotate, export | Human approval required over configured limits |

## Demo-ready command families

```text
order
transfer
research_mint
approve_signal
cancel_order
operator_note
```

## IDE command lifecycle

```text
DRAFT_COMMAND
  -> POLICY_PRECHECKED
  -> HUMAN_APPROVAL_REQUIRED | REJECTED | APPROVED_FOR_PAPER
  -> PAPER_OR_TESTNET_ADAPTER_QUEUED
  -> SIMULATED_FILL_OR_WORK_RECEIPT
  -> PROOF_ROOM_RECORDED
  -> IDE_VISIBLE_SUMMARY
```

## Required implementation surfaces

| Surface | Required file/package |
|---|---|
| Types and policy | `src/ai-wallet/src/types.ts`, `src/ai-wallet/src/policy.ts` |
| Demo protocol code | `src/ai-wallet/src/execution-demos.ts` |
| Demo tests | `src/ai-wallet/src/execution-demos.test.ts` |
| Operator guide | `docs/AGENT_EXECUTION_DEMOS.md` |
| IDE runway | `docs/PARALLAX_IDE_RUNWAY.md` |

## Live-path boundary

The IDE may model stablecoin, fiat/debit, demo-broker, and live execution paths only as future-gated states.

Do not enable:

```text
real custody
live broker execution
autonomous live trading
fiat/debit on-ramp
stablecoin redemption
public token sale
```

until legal, custody, security, compliance, observability, halt/recovery, and external review gates are satisfied.

## Operator acceptance checklist

```text
[ ] Wallet creation preview works.
[ ] Command JSON preview works.
[ ] Policy reason codes are visible.
[ ] Human approval threshold behavior is visible.
[ ] Live-mode blocked banner is always visible in alpha.
[ ] Receipt chain appears after evaluation.
[ ] PXCRED/PXAI/PXGPU accounting is shown only as internal/testnet credit.
[ ] Export includes proof-room payload hash and Merkle leaf.
```

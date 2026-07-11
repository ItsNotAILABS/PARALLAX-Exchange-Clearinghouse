# PARALLAX Agent Execution Demos

This document defines the first demo-grade agent execution loops for PARALLAX.

These demos extend the existing paper-first alpha posture. They show how an AI agent can move from structured intent to policy evaluation, simulated or testnet action, verifiable receipt, internal accounting, and proof-room auditability without enabling unrestricted live execution.

## Safety posture

Current alpha scope:

```text
paper trading
testnet contracts
simulated balances
internal agent credits
receipt-backed proof flows
operator approval gates
```

Explicitly out of alpha scope unless separate legal, security, custody, compliance, broker, and operational readiness gates are completed:

```text
live custody
live broker execution
real money movement
regulated exchange activity
autonomous live trading
public token sale
mainnet bridge
```

The demos below are safe because they are modeled as paper, demo-broker, testnet, or internal-credit flows first.

---

## Shared command lifecycle

Every agent action should follow the same path:

```text
agent intent
  -> structured command proposal
  -> edge policy precheck
  -> native C/C++ policy gate
  -> optional human approval
  -> paper/testnet/internal execution
  -> receipt generation
  -> Merkle proof-room append
  -> token/accounting update
  -> audit export
```

The core contract is:

```text
intent -> policy -> action -> receipt -> proof -> accounting
```

---

## Default alpha policy example

```json
{
  "policy_id": "parallax-alpha-default-v1",
  "mode": "paper",
  "allowed_modes": ["paper", "testnet"],
  "blocked_modes": ["restricted_live", "live"],
  "allowed_assets": ["PXUSD", "PXAI", "PXGPU", "PXCRED", "PXICP", "PXETH"],
  "allowed_command_kinds": [
    "order",
    "cancel_order",
    "approve_signal",
    "research_mint",
    "transfer",
    "operator_note",
    "compute_run"
  ],
  "allowed_counterparties": ["internal", "paper-market", "research-mint", "operator", "compute-agent"],
  "max_notional_per_command": 10000,
  "daily_notional_limit": 50000,
  "human_approval_threshold": 2500,
  "live_mode_block": true,
  "receipt_required": true,
  "merkle_append_required": true
}
```

Policy meanings:

| Field | Meaning |
|---|---|
| `allowed_modes` | Only paper/testnet actions pass during alpha. |
| `blocked_modes` | Restricted/live execution must be rejected in alpha. |
| `max_notional_per_command` | Hard notional cap per command. |
| `daily_notional_limit` | Running daily cap for the AI wallet. |
| `human_approval_threshold` | Commands above this require operator approval. |
| `receipt_required` | Every action emits an audit receipt. |
| `merkle_append_required` | Every receipt must be inserted into proof room. |

---

## Receipt structure

Every successful or blocked command should emit a receipt.

```json
{
  "receipt_schema": "parallax.agent_execution_receipt.v1",
  "receipt_id": "pxr_2026_000001",
  "receipt_kind": "paper_order_fill",
  "created_at": "2026-07-11T00:00:00Z",
  "system_mode": "paper",
  "wallet_id": "aiw_abc123",
  "agent_id": "agent_signal_alpha_001",
  "command_id": "cmd_789",
  "signal_id": "sig_high_conf_789",
  "policy_id": "parallax-alpha-default-v1",
  "policy_version": "1.0.0",
  "policy_decision": {
    "decision": "requires_human_approval",
    "reason_codes": ["HUMAN_APPROVAL_THRESHOLD_EXCEEDED"],
    "command_notional": 4500,
    "projected_daily_notional": 12500,
    "evaluated_by": ["cloudflare-edge", "native-cpp-gate"]
  },
  "approval": {
    "required": true,
    "approved_by": "operator",
    "approved_at": "2026-07-11T00:01:00Z"
  },
  "execution": {
    "venue": "parallax-paper-ledger",
    "symbol": "BTC-PAPER",
    "side": "buy",
    "order_amount": 4500,
    "limit_price": 67200,
    "fill_price": 67198.5,
    "fill_quantity": 0.066966,
    "fill_id": "fill_paper_001",
    "status": "filled"
  },
  "hashes": {
    "command_hash": "sha256:...",
    "signal_hash": "sha256:...",
    "policy_hash": "sha256:...",
    "execution_hash": "sha256:...",
    "receipt_hash": "sha256:..."
  },
  "proof_room": {
    "merkle_room_id": "px-proof-room-alpha",
    "leaf_hash": "sha256:...",
    "merkle_root": "sha256:...",
    "index": 42
  },
  "credits": {
    "minted": [
      {
        "asset": "PXCRED",
        "amount": 1,
        "reason": "receipt_credit"
      }
    ]
  }
}
```

Important boundary:

> A receipt proves the command path, policy decision, execution event, hashes, and audit linkage. It does not prove trading profitability or remove market risk.

---

# Demo 1: Autonomous Paper Trading Agent

## Scenario

An AI trading agent monitors market signals and wants to place a paper trade using `PXUSD`.

## Flow

```text
AI signal detected
  -> deterministic AiWallet created in paper mode
  -> default alpha policy assigned
  -> agent proposes order command
  -> Cloudflare edge policy precheck
  -> native C/C++ gate evaluation
  -> human approval if over threshold
  -> paper order entered
  -> simulated fill emitted
  -> receipt generated
  -> PXCRED minted as receipt credit
  -> proof room Merkle leaf appended
```

## Command

```json
{
  "kind": "order",
  "wallet_id": "aiw_abc123",
  "asset": "PXUSD",
  "side": "buy",
  "amount": 4500,
  "symbol": "BTC-PAPER",
  "price": 67200,
  "signal_id": "sig_high_conf_789",
  "mode": "paper"
}
```

## Evaluation note

With the default alpha policy:

```text
amount 4500 < max command notional 10000 -> allowed
asset PXUSD -> allowed
mode paper -> allowed
amount 4500 > human threshold 2500 -> requires human approval
live execution -> blocked by policy
```

If the demo needs automatic approval, use an amount at or below `2500`.

## Outcome

The agent receives a verifiable, receipt-backed paper position without live risk.

---

# Demo 1B: Demo Broker Paper Adapter

## Scenario

PARALLAX routes an approved paper order into a connected demo broker account, such as Alpaca paper, IBKR paper, Tradier sandbox, or an exchange testnet adapter.

## Flow

```text
agent proposes order
  -> PARALLAX policy gate approves/requires approval
  -> broker adapter translates command
  -> demo broker paper API receives order
  -> broker returns fill id/status
  -> PARALLAX wraps fill in its own receipt
  -> PXUSD internal accounting updates
  -> PXCRED receipt credit minted
```

## Broker adapter command

```json
{
  "kind": "order",
  "wallet_id": "aiw_abc123",
  "asset": "PXUSD",
  "symbol": "AAPL",
  "side": "buy",
  "amount": 8500,
  "order_type": "market",
  "mode": "paper",
  "adapter": "alpaca-paper-adapter-v1"
}
```

## Adapter receipt extension

```json
{
  "adapter": "alpaca-paper-adapter-v1",
  "external_mode": "paper",
  "broker_order_id": "alpaca-paper-order-001",
  "broker_fill_id": "alpaca-paper-fill-001",
  "external_status": "filled",
  "external_raw_hash": "sha256:..."
}
```

## Outcome

PARALLAX can demo a real paper broker fill while keeping all authority, policy, accounting, and receipts inside PARALLAX.

---

# Demo 2: Research Minting Agent

## Scenario

An agent performs deep research and registers an artifact for internal credit.

## Command

```json
{
  "kind": "research_mint",
  "wallet_id": "aiw_research456",
  "artifact_hash": "0xabc123def456",
  "title": "Q3 2026 Macro Impact on BTC",
  "confidence": 0.87,
  "scope": "research-mint",
  "mode": "paper"
}
```

## Flow

```text
research artifact produced
  -> artifact hash computed
  -> research_mint command proposed
  -> policy checks wallet scope
  -> receipt emitted with artifact hash and metadata
  -> PXAI credited to wallet
  -> receipt added to proof room
```

## Outcome

The agent earns internal `PXAI` work credit tied to a traceable research artifact.

---

# Demo 3: Multi-Agent Internal Transfer + Settlement

## Scenario

A research agent pays a compute agent for running simulations.

## Command

```json
{
  "kind": "transfer",
  "from_wallet": "aiw_research456",
  "to_wallet": "aiw_compute789",
  "asset": "PXAI",
  "amount": 1200,
  "memo": "Payment for GPU simulation batch #42",
  "mode": "paper"
}
```

## Flow

```text
research agent has PXAI credits
  -> transfer command proposed
  -> counterparty allowlist checked
  -> notional/daily limits checked
  -> internal transfer recorded
  -> settlement receipt generated
  -> PXCRED minted on receipt
  -> both wallets link to proof room record
```

## Outcome

Agents collaborate economically using internal credits with full audit trails.

---

# Demo 4: Compute-Bound Strategy Runner

## Scenario

An agent wants to run a heavy backtest, Monte Carlo simulation, or strategy benchmark.

## Command

```json
{
  "kind": "compute_run",
  "wallet_id": "aiw_strategy001",
  "asset": "PXGPU",
  "amount": 250,
  "job": {
    "job_id": "sim_batch_42",
    "strategy_id": "hft_momentum_alpha_v1",
    "dataset_ref": "market_fixture_btc_2026_q3",
    "runtime": "native-cpp-worker",
    "max_runtime_seconds": 300
  },
  "mode": "paper"
}
```

## Flow

```text
agent proposes compute intent
  -> PXGPU budget checked
  -> compute credit reserved/burned
  -> native worker or simulation runner executes
  -> benchmark receipt generated
  -> results hash stored
  -> PXCRED issued for completed compute task
```

## Outcome

PARALLAX ties compute cost, native execution, research output, and proof-room records into one governed flow.

---

# Demo 5: HFT Signal Approval Loop

## Scenario

A high-frequency signal engine emits many short-lived signals, but PARALLAX only permits governed paper/testnet execution.

## Signal object

```json
{
  "signal_schema": "parallax.hft_signal.v1",
  "signal_id": "sig_hft_2026_000042",
  "strategy_id": "hft_momentum_alpha_v1",
  "symbol": "BTC-PAPER",
  "side": "buy",
  "confidence": 0.91,
  "expected_horizon_ms": 750,
  "max_slippage_bps": 15,
  "risk_score": 0.22,
  "source_hash": "sha256:...",
  "created_at": "2026-07-11T00:00:00.000Z"
}
```

## Command derived from signal

```json
{
  "kind": "order",
  "wallet_id": "aiw_hftpaper001",
  "asset": "PXUSD",
  "side": "buy",
  "amount": 2400,
  "symbol": "BTC-PAPER",
  "price": 67200,
  "signal_id": "sig_hft_2026_000042",
  "mode": "paper",
  "time_in_force": "IOC"
}
```

## HFT-specific policy additions

```json
{
  "hft_policy_id": "parallax-alpha-hft-paper-v1",
  "mode": "paper",
  "max_orders_per_minute": 60,
  "max_open_positions": 5,
  "max_symbol_exposure": 15000,
  "min_signal_confidence": 0.75,
  "max_signal_age_ms": 2000,
  "max_slippage_bps": 25,
  "kill_switch_enabled": true,
  "live_mode_block": true,
  "receipt_required": true
}
```

## Flow

```text
HFT signal emitted
  -> signal freshness checked
  -> confidence and risk checked
  -> command notional checked
  -> rate limits checked
  -> exposure checked
  -> paper order approved or rejected
  -> receipt links signal hash to order/fill
```

## Outcome

PARALLAX can demonstrate HFT-style signal-to-order automation while keeping the agent inside paper/testnet guardrails.

---

# Future path: stablecoin, crypto, debit, and live execution

These are future phases, not alpha defaults.

## Phase A: Stablecoin-backed internal PXUSD

```text
user deposits stablecoin through compliant custody or partner route
  -> custody/compliance receipt created
  -> equivalent PXUSD credited internally
  -> agent operates under policy-gated paper/testnet/live-permitted scope
  -> withdrawal burns PXUSD and releases stablecoin through approved rail
```

Required gates:

```text
custody model
KYC/AML path if applicable
sanctions screening if applicable
wallet security
legal/compliance review
external audit or equivalent review
operator halt
receipt reconciliation
```

## Phase B: Fiat/debit on-ramp

```text
user links debit/bank through regulated payment partner
  -> partner handles fiat compliance and settlement
  -> PARALLAX receives funding receipt
  -> internal PXUSD credited
  -> agent actions remain policy-gated
```

Required gates:

```text
regulated payment partner
KYC/AML partner flow
chargeback/fraud handling
user disclosures
accounting and reconciliation
operator review
```

## Phase C: Controlled live execution

Live execution is not an alpha capability.

Minimum requirements:

```text
separate live policy mode
human approval / multi-approval for live actions
broker/custody/compliance integration
risk engine
kill switch
position/exposure limits
full observability
incident response
security review
legal/compliance review
external audit or equivalent review
live deployment runbook
```

Live-mode command example should be rejected until gates are satisfied:

```json
{
  "kind": "order",
  "wallet_id": "aiw_live_candidate",
  "asset": "USD",
  "side": "buy",
  "amount": 1000,
  "symbol": "BTC-USD",
  "mode": "live"
}
```

Expected alpha decision:

```json
{
  "decision": "rejected",
  "reason_codes": ["LIVE_MODE_BLOCKED", "ALPHA_PAPER_TESTNET_ONLY"],
  "human_approval_allowed": false
}
```

---

# Demo validation checklist

A demo is valid only if it proves:

```text
structured command exists
policy was evaluated
native gate agrees or logs discrepancy
human approval is required when threshold is crossed
paper/testnet/internal execution occurred
receipt was created
receipt hash was computed
proof-room Merkle leaf was appended
internal token/accounting update is linked to receipt
live execution remains blocked
```

---

# Summary table

| Demo | Main asset | Main proof | Live risk? |
|---|---|---|---|
| Autonomous paper trading | PXUSD | Fill receipt + PXCRED | No |
| Demo broker paper adapter | PXUSD | Broker paper fill wrapped by PARALLAX receipt | No |
| Research minting | PXAI | Artifact receipt | No |
| Internal transfer | PXAI / PXUSD | Settlement receipt + PXCRED | No |
| Compute-bound strategy runner | PXGPU | Benchmark receipt + PXCRED | No |
| HFT signal approval loop | PXUSD | Signal/order/fill linked receipt | No |
| Stablecoin-backed PXUSD | PXUSD | Custody + mint/burn receipts | Future gate |
| Debit/fiat on-ramp | PXUSD | Partner funding receipt | Future gate |
| Controlled live execution | USD/crypto/broker asset | Live execution receipt | Future gate only |

---

# Implementation gates

Recommended next implementation order:

```text
1. Add typed demo fixtures for all commands.
2. Add policy examples under config/policies/.
3. Add receipt examples under examples/receipts/.
4. Add HFT signal fixture under examples/signals/.
5. Add demo-broker adapter interface with mock implementation only.
6. Add proof-room Merkle append test.
7. Add alpha validation command that rejects live-mode examples.
8. Surface the demos in Control Tower after receipts are visible.
```

This keeps PARALLAX aligned with its product boundary: agents can paper trade, research-mint, transfer internal credits, and pay for compute with receipts now; live funds and live broker execution remain future, gated, and explicit.
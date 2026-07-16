# PARALLAX Agentic Platform Orchestration

**Status:** additive orchestration layer  
**Platform posture:** paper / testnet / internal-credit first  
**No live broker, custody, fund, bank, exchange, public token sale, yield, or mainnet-value claim is made by this document.**

## Why this exists

PARALLAX now has three related repositories that need to operate as one agentic platform without losing their separate identities.

The correct structure is not one giant repo and not three disconnected repos. It is a supervised agentic platform where each repo owns one runtime agent and one domain lane.

## Runtime agents

| Runtime agent | Repo | Platform role |
|---|---|---|
| `parallax-clearinghouse-agent` / `ARGOS-CLEAR` | `ItsNotAILABS/PARALLAX-Exchange-Clearinghouse` | canonical clearing, settlement, proof room, runtime tokenomics, receipt ledger |
| `parallax-hft-fund-agent` / `NOVA-HFT` | `ItsNotAILABS/PARRALAX-AIHFTFUND` | strategy, signal, market-data, benchmark, paper/testnet order proposal |
| `sns-token-governor-agent` / `PLAX-SNS-GOV` | `ItsNotAILABS/SNS---TOKEN` | SNS/ICP governance, token-law, proposal, upgrade, and notary-prep lane |

## Orchestrator layer

The platform orchestrator sits above all three agents.

```text
Operator / AI Builder / QWorker
-> PARALLAX Platform Orchestrator
-> repo runtime agent
-> governance precheck
-> paper/testnet/internal-credit action
-> receipt
-> tokenomics accounting
-> research/proof export
```

The orchestrator does not allow one repo to self-certify the entire platform. Each lane must emit receipts and pass claim-boundary checks.

## Cross-repo flow

```text
1. HFT repo observes market data or strategy event.
2. HFT agent emits a paper/testnet proposal and benchmark/compute receipt.
3. Clearinghouse agent evaluates risk, settlement, accounting, and proof-room recording.
4. Clearinghouse emits receipt-backed tokenomics event.
5. SNS governor agent converts policy-affecting changes into governance-ready proposal drafts.
6. Operator reviews before anything leaves paper/testnet/internal-credit scope.
```

## Tokenomics connection

The Clearinghouse repo remains the source of truth for runtime tokenomics. HFT and SNS repos should inherit the conservative boundary.

Runtime extension units:

- `PXBYTE`: measured byte accounting
- `PXNOVA`: local runtime-cycle accounting
- `PXRCPT`: proof/receipt accounting
- `PXTEAM`: team/QWorker lane accounting

These are local accounting/provenance units in the current posture. They are not cash, securities, fund shares, wages, redeemable points, or public sale tokens.

## First platform integration target

Create an event contract that all three agents can share:

```json
{
  "event_id": "string",
  "source_agent": "parallax-hft-fund-agent | parallax-clearinghouse-agent | sns-token-governor-agent",
  "event_type": "strategy_signal | paper_order_proposal | settlement_receipt | tokenomics_update | governance_proposal_draft",
  "mode": "paper | testnet | internal_credit | governance_draft",
  "artifact_hash": "sha256-or-null",
  "receipt_hash": "sha256-or-null",
  "requires_operator_approval": true,
  "claim_boundary_passed": false
}
```

## Production boundary

This orchestration layer makes the repos easier to combine into a full agentic trading platform. It does not activate live trading, custody, broker routing, fund activity, bank/money-transfer activity, SNS/mainnet governance, or public token sale behavior.

# PARALLAX Private Blockchain Clouds

This document defines the permissioned/private blockchain cloud layer for PARALLAX.

A private blockchain cloud is a controlled ledger network for paper/testnet-style agent economies, receipt credits, settlement receipts, research minting, compute credits, and audit exports. It is not a public token launch and does not enable live custody by default.

## Core purpose

```text
agent intent
  -> policy gate
  -> private ledger command
  -> permissioned validator network
  -> receipt event
  -> Merkle/proof export
  -> private proof room
```

## Network roles

| Role | Purpose |
|---|---|
| Operator | Owns emergency halt, release gates, and deployment posture. |
| Tenant admin | Owns tenant policies, validator allowlists, and proof-room access. |
| Approved agent | Proposes commands through AI wallet policy. |
| Validator node | Validates permissioned ledger events. |
| Auditor | Reads receipt exports and proof-room manifests. |
| Bridge worker | Translates PARALLAX receipt events into private chain events. |

## Ledger types

| Ledger | Purpose | Boundary |
|---|---|---|
| `permissioned-pxusd-ledger` | Internal stable accounting for paper/testnet flows. | no live redemption by default |
| `permissioned-pxai-ledger` | Agent research/work credits. | internal credit only |
| `permissioned-pxgpu-ledger` | Compute budget credits. | internal compute accounting |
| `permissioned-pxcred-ledger` | Receipt-backed action credit. | proof/accounting only |
| `permissioned-settlement-ledger` | Paper/testnet settlement receipts. | no regulated settlement claim |

## Genesis manifest

Every private blockchain cloud must carry a genesis manifest:

```json
{
  "schema": "parallax.private_chain.genesis.v1",
  "chain_id": "px-private-alpha-001",
  "network_class": "permissioned_private_chain",
  "operator": "operator-principal-or-org",
  "tenant_id": "tenant-alpha",
  "validators": [
    {
      "node_id": "validator-001",
      "role": "validator",
      "status": "allowlisted"
    }
  ],
  "ledgers": [
    "permissioned-pxusd-ledger",
    "permissioned-pxai-ledger",
    "permissioned-pxgpu-ledger",
    "permissioned-pxcred-ledger"
  ],
  "live_money_enabled": false,
  "public_token_sale_enabled": false,
  "created_at": "ISO-8601"
}
```

## Receipt bridge contract

Private chain events must originate from PARALLAX receipt records or explicit operator genesis actions.

```json
{
  "schema": "parallax.private_chain.receipt_bridge.v1",
  "source_receipt_id": "aiwrcpt_...",
  "wallet_id": "aiw_...",
  "agent_id": "agent-...",
  "command_id": "aiwcmd_...",
  "policy_decision": "approved",
  "ledger": "permissioned-pxcred-ledger",
  "event_kind": "receipt_credit_minted",
  "asset": "PXCRED",
  "amount": 1,
  "source_payload_hash": "hash",
  "merkle_leaf": "hash",
  "private_chain_tx_id": "optional-before-submit",
  "boundary": "paper_or_testnet"
}
```

## Validator policy

Validator nodes are permissioned. No node may join by default.

Required validator controls:

- validator allowlist,
- node identity manifest,
- key rotation policy,
- chain configuration hash,
- operator halt compatibility,
- receipt replay protection,
- exportable audit logs.

## Bridge safety rules

```text
RULE 1: A private chain event must reference a PARALLAX receipt or operator genesis event.
RULE 2: Public token sale is blocked.
RULE 3: Mainnet value bridge is blocked in alpha.
RULE 4: Private chain ledger balances are accounting/proof records unless a later regulated custody layer is explicitly approved.
RULE 5: AI agents cannot self-approve validator or bridge configuration.
RULE 6: Operator halt must be able to pause bridge writes.
```

## Proof export

Every private chain batch should export:

```text
batch_id
chain_id
validator_set_hash
receipt_ids
ledger_events
merkle_root
operator_halt_state
created_at
```

The export lands in the private proof room and can later be attached to PARALLAX audit exports.

## Deployment maturity ladder

| Stage | Meaning | Live funds? |
|---|---|---:|
| design | docs, manifests, validation only | no |
| local | local permissioned node simulation | no |
| team-alpha | internal permissioned network | no |
| enterprise-private | tenant VPC/on-prem permissioned network | no by default |
| regulated-live-candidate | requires legal, security, custody, audit, observability | separate review |

## Current status

Repository-ready protocol design. No private blockchain network is claimed deployed by this document.

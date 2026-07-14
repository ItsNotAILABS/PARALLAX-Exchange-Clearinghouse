# PARALLAX Multi-Repo Federation

PARALLAX is now treated as the **authority repo** for an ecosystem of feeder repositories.

The goal is not to merge every codebase into one repository. The goal is to let many repositories produce useful signals, schemas, adapters, proofs, runtime patterns, and research outputs while PARALLAX remains the integration, policy, receipt, and operator-control surface.

```text
feeder repos
  -> classified feeder records
  -> policy/proof review
  -> integration PRs
  -> PARALLAX authority repo
  -> receipts, proof room, operator control, alpha gates
```

## Authority repo

```text
ItsNotAILABS/PARALLAX-Exchange-Clearinghouse
```

This repository owns:

- multi-ledger registry,
- token economics registry,
- private cloud registry,
- AI wallet execution policy,
- agent command evaluation,
- receipt ledger shapes,
- proof room exports,
- operator control surfaces,
- paper/testnet-first financial boundaries.

## Feeder lanes

The first registered feeder lanes are:

| Repo | Lane | Feeds into PARALLAX |
|---|---|---|
| `ItsNotAILABS/PARRALAX-AIHFTFUND` | HFT signal and strategy | AI Execution, Trade, Native Interface, Proof Room |
| `ItsNotAILABS/SNS---TOKEN` | Token governor and SNS | Token Economics, Governance, Proof Room |
| `ItsNotAILABS/NATIVE-NOVA-PROTOCOL` | Native protocol substrate | Native Interface, Governance, Private Blockchain Clouds |
| `ItsNotAILABS/MedinaMemorySystems` | Memory and product surface | Proof Room, Control Tower, Research Mint |
| `ItsNotAILABS/nexus` | MCP federation control plane | Cloudflare Edge, Control Tower, Federation Registry |
| `ItsNotAILABS/nova-intelligence` | NOVA runtime intelligence | AI Execution, Governance, Control Tower |
| `ItsNotAILABS/PhantomSDK` | Phantom simulation SDK | Compute Runner, Research Mint, Proof Room |
| `ItsNotAILABS/x-mcp-skills` | External AI connector control | AI Execution, Control Tower, Edge Gateway |

`demo-repository` is ignored. `organism-bots-mcp-server` is not pushed in this pass.

## Feeder record

Every upstream contribution should eventually become a record shaped like:

```json
{
  "schema": "parallax.feeder_record.v1",
  "repo": "ItsNotAILABS/PARRALAX-AIHFTFUND",
  "lane": "hft_signal_and_strategy",
  "sourceCommit": "sha_or_null",
  "sourcePath": "path_or_null",
  "artifactHash": "sha256_or_null",
  "feedType": "paper_signals",
  "classification": "public_safe",
  "targetSurface": "AI Execution",
  "policyDecision": "review_required",
  "receiptRef": null,
  "notes": "Candidate HFT paper-signal schema; no live execution."
}
```

## Promotion states

```text
discovered
  -> feeder_manifest_present
  -> source_signal_collected
  -> classified
  -> proof_mapped
  -> policy_reviewed
  -> integration_pr_opened
  -> integrated_to_authority_repo
  -> rejected_or_private_vault
```

## Non-negotiable gates

A feeder output cannot become PARALLAX authority unless:

1. the source repo is registered,
2. private/public boundary is assigned,
3. source commit or artifact hash is recorded,
4. the target PARALLAX surface is declared,
5. live/custody/mainnet claims are blocked during alpha,
6. proof or receipt expectations are mapped,
7. an explicit PR integrates it into the authority repo.

## Private feeder rule

Private repos may feed PARALLAX, but only through:

- sanitized manifests,
- capability summaries,
- interface contracts,
- hashes,
- receipt records,
- public-safe doctrine slices,
- explicitly approved bridge records.

They must not leak private root law, secrets, keys, credentials, internal memory, unapproved wallet material, or unreviewed production claims.

## Financial boundary

The federation does not enable:

- live money movement,
- live broker execution,
- custody,
- regulated exchange activity,
- public mainnet bridge behavior,
- autonomous live AI trading,
- public token sale claims.

Those remain future-gated behind legal, security, custody, compliance, operator, and audit readiness.

## Practical operating model

For every feeder repo:

```text
1. Add a PARALLAX_FEEDER_MANIFEST.md or equivalent registry file.
2. Declare what the repo can feed.
3. Declare what it must not feed.
4. Add a source commit or artifact hash when material is promoted.
5. Open an authority-repo PR into PARALLAX with proof mapping.
6. Store the promotion decision as a receipt/proof-room record later.
```

## Why this matters

This makes PARALLAX the center without making every other repo subordinate code-wise.

Each repo becomes an organ:

- HFT repo produces strategy signals.
- SNS repo produces token/governance policy.
- Native protocol repo produces execution law and canister primitives.
- Memory repo produces continuity and proof-room surfaces.
- Nexus produces federation/tool routing.
- Nova produces runtime intelligence envelopes.
- PhantomSDK produces simulation and compute primitives.
- x-mcp-skills produces external AI connector rules.

PARALLAX consumes them through policy, proof, and receipts.

Final rule:

> Many repos may feed PARALLAX. Only PARALLAX decides what becomes governed financial authority.

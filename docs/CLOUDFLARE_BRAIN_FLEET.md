# PARALLAX Cloudflare Brain Fleet

PARALLAX can now model a Cloudflare-native fleet of small edge agents: repo sentinels, build runners, research workers, security monitors, vault operators, release gatekeepers, docs publishers, and receipt writers.

This is not presented as a claim that hundreds or thousands of PARALLAX brains are currently deployed. It is a governed architecture and runnable Worker scaffold for that direction.

## Why this matters

Cloudflare Agents provide durable agent identity, local SQL-backed state, real-time connections, scheduled work, and recoverable execution. Durable Objects provide a stateful coordination primitive for applications that need synchronized clients and durable state. Dynamic Workers provide runtime-created Workers for sandboxed code execution.

For PARALLAX, that maps cleanly to:

```text
Repo/project -> brain class -> edge Worker -> central dashboard/API -> receipt chain -> operator gate
```

## Fleet classes

| Brain class | Role |
|---|---|
| `repo_sentinel` | Watch repository status, open PRs, validation drift, and release state |
| `build_runner` | Propose build/test jobs and record outcomes |
| `research_worker` | Turn docs, APIs, and architecture notes into evidence packets |
| `security_monitor` | Watch boundary, secret, and live-execution risks |
| `receipt_writer` | Convert actions into hash-linked proof records |
| `vault_operator` | Inspect Agent Vault and wallet state without live execution |
| `docs_publisher` | Prepare public/internal docs and README surfaces |
| `release_gatekeeper` | Decide whether a release is ready, blocked, or needs evidence |

## Runnable scaffold

```text
apps/cloudflare-brain-fleet/worker.js
config/platform/parallax.cloudflare-brain-fleet.json
```

Routes:

| Route | Purpose |
|---|---|
| `GET /brain-fleet` | Browser UI |
| `GET /api/brain-fleet` | Fleet status |
| `POST /api/brain-fleet/spawn` | Register a governed brain instance |
| `POST /api/brain-fleet/message` | Send an operator message to the fleet harness |
| `POST /api/brain-fleet/tick` | Tick all registered brains |
| `GET /api/brain-fleet/receipts` | Read fleet receipts |

## Boundary

The fleet is allowed to plan, propose, observe, and receipt. It is not allowed to mutate production Cloudflare resources, exfiltrate secrets, store raw private keys, execute live broker orders, move live money, sell tokens, or bridge public mainnet assets.

Denied capability patterns return:

```json
{
  "error": "brain_fleet_boundary_denied",
  "posture": "paper_testnet_first"
}
```

## Cloudflare-native production path

The next production hardening pass should replace the in-memory scaffold with:

1. Durable Object coordination per brain or repo.
2. SQLite-backed event and receipt tables.
3. Workers AI / Agents SDK turn handler.
4. MCP tool adapter with allowlisted Cloudflare API actions.
5. Dynamic Worker sandbox lane for generated code.
6. Browser Run lane for UI inspection and screenshot evidence.
7. Central dashboard tab inside PARALLAX.
8. Validation receipt proving no live money or unauthorized Cloudflare mutation path exists.

## Operator command

```bash
pnpm platform:validate
```

The validator emits a platform receipt and must include the Cloudflare brain fleet registry before this layer is considered ready for demo.

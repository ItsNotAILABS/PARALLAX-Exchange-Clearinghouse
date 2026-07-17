# PARALLAX Agent Vault API

PARALLAX now exposes a demo-ready platform layer where the product primitive is an **agent vault**, not a standalone wallet. A vault creates a professional wallet system, outside-wallet connector map, agent-swarm permissions, multi-ledger accounts, prebuilt policy tools, a receipt room, and a monetization profile.

## Local demo

```bash
pnpm platform:dev
```

Open:

```text
http://localhost:8787/platform
```

The local server serves the front end and mounts the same API shape that can be handed to a Cloudflare Worker.

## Virtual servers

- `agent-control` handles agent status and ticks.
- `vault-wallet-ledger` handles vaults, embedded wallet systems, connector maps, ledgers, and paper transfers.
- `proof-room` handles receipts and sample payloads.
- `billing-meter` exposes monetization paths without hardcoding prices.

## API

```text
GET  /api/status
GET  /api/agents
POST /api/agents/tick
GET  /api/ledgers
GET  /api/wallets
POST /api/wallets
GET  /api/vaults
POST /api/vaults
GET  /api/vaults/:id
POST /api/vaults/:id/connectors
POST /api/vaults/:id/agents
POST /api/vaults/:id/ledger/transfer
POST /api/ledger/transfer
GET  /api/receipts
GET  /api/monetization
GET  /api/samples
```

## Create an agent vault

```bash
curl -X POST http://localhost:8787/api/vaults \
  -H 'content-type: application/json' \
  -d '{"name":"Customer AI Ops Vault","agentId":"customer-agent-001","owner":"customer-operator","plan":"vault_api_subscription","pxusd":75000,"pxai":15000}'
```

The response includes:

- `vaultId`
- primary wallet
- outside wallet connector map for EVM, Solana, ICP, Bitcoin, and Cosmos
- agent allowlist and human threshold policy
- prebuilt tools such as receipt room, ledger reconciler, market sentinel, connector health, and billing meter
- sample API key for demo onboarding
- monetization profile
- `vault.created` receipt

## Add an outside wallet connector

```bash
curl -X POST http://localhost:8787/api/vaults/<vaultId>/connectors \
  -H 'content-type: application/json' \
  -d '{"id":"custom-evm-safe","networks":["base","ethereum"]}'
```

This records a connector link inside the vault. It does not request private keys, seed phrases, custody, or live signing authority.

## Add an agent to the vault allowlist

```bash
curl -X POST http://localhost:8787/api/vaults/<vaultId>/agents \
  -H 'content-type: application/json' \
  -d '{"agentId":"customer-risk-agent"}'
```

## Monetization paths

Current product lanes exposed by the API and docs:

1. **Vault API Subscription** — charge per active agent vault per month.
2. **Agent Wallet Metering** — charge by API call, proposed transfer, or ledger operation.
3. **Enterprise Receipt Room** — charge for proof-room seats, retention, export, and compliance packets.
4. **Outside Wallet Connector Marketplace** — charge for premium connectors or enterprise wallet adapters.
5. **Managed Agent Operations** — operate and monitor customer agent vaults as a managed service.
6. **White Label Agent Vaults** — provide branded vault instances for other AI-agent platforms.

Pricing and payment rails are intentionally not hardcoded in this repo.

## Legacy wallet route

`POST /api/wallets` still exists for backwards compatibility, but the commercial path is `POST /api/vaults`.

## Cloudflare handoff

`apps/agent-api/worker.js` exports a Worker-compatible default fetch handler. A Cloudflare Worker can mount it directly or copy the route logic into an existing Worker entrypoint.

## Marketing-safe statement

PARALLAX provides a paper/testnet-first agent vault and multi-ledger API for external AI-agent integrations. The current platform demonstrates vault creation, embedded wallet systems, outside-wallet connector records, paper balances, ledger routes, agent ticks, billing meters, monetization paths, and receipts. It does not provide custody, private-key handling, live broker execution, live money movement, token sale behavior, or public mainnet bridge execution.

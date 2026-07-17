# PARALLAX Background Agents and External Agent API

PARALLAX now exposes a demo-ready platform layer for background agents, virtual servers, external agent wallet creation, multi-ledger inspection, paper transfers, and receipt output.

## Local demo

```bash
pnpm platform:dev
```

Open:

```text
http://localhost:8787/platform
```

The local server serves the existing front end and mounts the same API shape that can be handed to a Cloudflare Worker.

## Virtual servers

- `agent-control` handles agent status and ticks.
- `wallet-ledger` handles external agent wallet creation, wallet listing, ledger listing, and paper transfers.
- `proof-room` handles receipt listing and sample payloads.

## API

```text
GET  /api/status
GET  /api/agents
POST /api/agents/tick
GET  /api/ledgers
GET  /api/wallets
POST /api/wallets
POST /api/ledger/transfer
GET  /api/receipts
GET  /api/samples
```

### Create an external agent wallet

```bash
curl -X POST http://localhost:8787/api/wallets \
  -H 'content-type: application/json' \
  -d '{"agentId":"marketing-demo-agent","owner":"demo-operator","pxusd":25000,"pxai":5000}'
```

### Tick a background agent

```bash
curl -X POST http://localhost:8787/api/agents/tick \
  -H 'content-type: application/json' \
  -d '{"agentId":"agent-market-sentinel"}'
```

### Sample paper transfer

```bash
curl -X POST http://localhost:8787/api/ledger/transfer \
  -H 'content-type: application/json' \
  -d '{"fromWalletId":"pxw_demo_external_agent","toWalletId":"pxw_target","asset":"PXUSD","amount":250}'
```

## Cloudflare handoff

`apps/agent-api/worker.js` exports a Worker-compatible default fetch handler. A Cloudflare Worker can mount it directly or copy the route logic into an existing Worker entrypoint.

## Marketing-safe statement

PARALLAX provides a paper/testnet-first agent wallet and multi-ledger API for external agent integrations. The current platform demonstrates wallet creation, paper balances, ledger routes, agent ticks, and receipts. It does not provide custody, private-key handling, live broker execution, live money movement, token sale behavior, or public mainnet bridge execution.

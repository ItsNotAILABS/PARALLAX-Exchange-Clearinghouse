const now = () => new Date().toISOString();
const hash = (value) => {
  let h = 2166136261;
  for (const c of JSON.stringify(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `px_${(h >>> 0).toString(16).padStart(8, '0')}`;
};

const state = {
  ledgers: [
    { id: 'parallax-paper-ledger', mode: 'paper', assets: ['PXUSD', 'PXAI', 'PXCRED'], live: false },
    { id: 'agent-credit-ledger', mode: 'paper', assets: ['PXCRED', 'PXGPU'], live: false },
    { id: 'icp-local-ledger', mode: 'testnet', assets: ['PXICP'], live: false }
  ],
  wallets: [{ walletId: 'pxw_demo_external_agent', agentId: 'external-demo-agent', owner: 'sample-principal', mode: 'paper', balances: { PXUSD: 50000, PXAI: 10000, PXCRED: 0 }, createdAt: now() }],
  agents: [
    { id: 'agent-market-sentinel', status: 'running', cadence: 'simulated-30s', lastTick: null },
    { id: 'agent-risk-gatekeeper', status: 'idle', cadence: 'on-demand', lastTick: null },
    { id: 'agent-receipt-writer', status: 'running', cadence: 'event-driven', lastTick: null },
    { id: 'agent-ledger-reconciler', status: 'running', cadence: 'simulated-60s', lastTick: null }
  ],
  receipts: []
};

const json = (body, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' } });
const readJson = async (request) => { try { return await request.json(); } catch { return {}; } };
const receipt = (type, payload) => { const r = { receiptId: hash({ type, payload, at: now(), n: state.receipts.length }), type, payloadHash: hash(payload), createdAt: now(), boundary: 'paper_testnet_only' }; state.receipts.push(r); return r; };

async function route(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return json({ ok: true });
  if (url.pathname === '/api/status') return json({ ok: true, platform: 'PARALLAX Agent API', posture: 'paper_testnet_first', servers: ['agent-control', 'wallet-ledger', 'proof-room'], boundaries: ['no custody', 'no live broker', 'no private keys'] });
  if (url.pathname === '/api/agents' && request.method === 'GET') return json({ agents: state.agents });
  if (url.pathname === '/api/agents/tick' && request.method === 'POST') { const body = await readJson(request); const agent = state.agents.find((a) => a.id === body.agentId) || state.agents[0]; agent.status = 'running'; agent.lastTick = now(); return json({ agent, receipt: receipt('agent.tick', agent) }); }
  if (url.pathname === '/api/ledgers' && request.method === 'GET') return json({ ledgers: state.ledgers });
  if (url.pathname === '/api/wallets' && request.method === 'GET') return json({ wallets: state.wallets });
  if (url.pathname === '/api/wallets' && request.method === 'POST') { const body = await readJson(request); const wallet = { walletId: `pxw_${hash(body).slice(3)}`, agentId: body.agentId || 'external-agent', owner: body.owner || 'external-owner', mode: 'paper', balances: { PXUSD: Number(body.pxusd ?? 10000), PXAI: Number(body.pxai ?? 1000), PXCRED: 0 }, createdAt: now() }; state.wallets.push(wallet); return json({ wallet, receipt: receipt('wallet.created', wallet) }, 201); }
  if (url.pathname === '/api/ledger/transfer' && request.method === 'POST') { const body = await readJson(request); const from = state.wallets.find((w) => w.walletId === body.fromWalletId); const to = state.wallets.find((w) => w.walletId === body.toWalletId); const asset = body.asset || 'PXUSD'; const amount = Number(body.amount || 0); if (!from || !to || amount <= 0) return json({ error: 'invalid_transfer_request' }, 400); if ((from.balances[asset] || 0) < amount) return json({ error: 'insufficient_paper_balance' }, 409); from.balances[asset] -= amount; to.balances[asset] = (to.balances[asset] || 0) + amount; return json({ transfer: { from: from.walletId, to: to.walletId, asset, amount, mode: 'paper' }, receipt: receipt('ledger.transfer', body) }); }
  if (url.pathname === '/api/receipts' && request.method === 'GET') return json({ receipts: state.receipts });
  if (url.pathname === '/api/samples' && request.method === 'GET') return json({ walletCreate: { agentId: 'marketing-demo-agent', owner: 'demo-operator', pxusd: 25000 }, transfer: { fromWalletId: 'pxw_demo_external_agent', toWalletId: 'pxw_target', asset: 'PXUSD', amount: 250 } });
  return json({ error: 'not_found', path: url.pathname }, 404);
}

export { route, state };
export default { fetch: route };

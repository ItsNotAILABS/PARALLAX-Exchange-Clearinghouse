const pc = { status: null, agents: [], ledgers: [], wallets: [], receipts: [] };
const q = (id) => document.getElementById(id);
const safe = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const api = async (path, options = {}) => {
  const response = await fetch(path, { cache: 'no-store', headers: { 'content-type': 'application/json' }, ...options });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
};
const renderJson = (id, value) => { const el = q(id); if (el) el.textContent = JSON.stringify(value, null, 2); };

async function loadPlatform() {
  try {
    pc.status = await api('/api/status');
    pc.agents = (await api('/api/agents')).agents;
    pc.ledgers = (await api('/api/ledgers')).ledgers;
    pc.wallets = (await api('/api/wallets')).wallets;
    pc.receipts = (await api('/api/receipts')).receipts;
  } catch (error) {
    const fallback = await api('../../config/platform/parallax.background-agents.json');
    pc.status = { ok: false, platform: 'PARALLAX sample mode', message: 'Run pnpm platform:dev for live local API.', error: error.message };
    pc.agents = fallback.backgroundAgents.map((agent) => ({ id: agent.id, status: 'sample', cadence: agent.cadence, lastTick: null }));
    pc.ledgers = [{ id: 'parallax-paper-ledger', mode: 'paper' }, { id: 'agent-credit-ledger', mode: 'paper' }, { id: 'icp-local-ledger', mode: 'testnet' }];
    pc.wallets = fallback.sampleWallets;
    pc.receipts = [];
  }
  renderPlatform();
}

function renderPlatform() {
  q('virtualServers').innerHTML = ['agent-control', 'wallet-ledger', 'proof-room'].map((name) => `<article class="card small"><div class="pill">virtual server</div><h3>${safe(name)}</h3><p>/api/${safe(name.split('-')[0])} routes ready for Node local or Cloudflare Worker.</p></article>`).join('');
  q('backgroundAgents').innerHTML = pc.agents.map((agent) => `<article class="card small"><div class="pill">${safe(agent.status)}</div><h3>${safe(agent.id)}</h3><p>${safe(agent.cadence)}</p><button data-agent="${safe(agent.id)}" class="secondary agentTick">Tick agent</button></article>`).join('');
  q('ledgerApi').innerHTML = pc.ledgers.map((ledger) => `<article class="card small"><h3>${safe(ledger.id)}</h3><p>${safe(ledger.mode)} · ${(ledger.assets || []).map(safe).join(', ')}</p></article>`).join('');
  q('apiWallets').innerHTML = pc.wallets.map((wallet) => `<article class="card small"><h3>${safe(wallet.walletId)}</h3><p>${safe(wallet.agentId)} · ${safe(wallet.mode)}</p><small>${safe(JSON.stringify(wallet.balances || {}))}</small></article>`).join('');
  renderJson('apiOutput', { status: pc.status, receipts: pc.receipts.slice(-5) });
  document.querySelectorAll('.agentTick').forEach((btn) => btn.onclick = () => tickAgent(btn.dataset.agent));
}

async function createDemoWallet() {
  const result = await api('/api/wallets', { method: 'POST', body: JSON.stringify({ agentId: 'marketing-demo-agent', owner: 'demo-operator', pxusd: 25000, pxai: 5000 }) });
  renderJson('apiOutput', result);
  await loadPlatform();
}
async function tickAgent(agentId = 'agent-market-sentinel') {
  const result = await api('/api/agents/tick', { method: 'POST', body: JSON.stringify({ agentId }) });
  renderJson('apiOutput', result);
  await loadPlatform();
}
async function sampleTransfer() {
  const wallets = (await api('/api/wallets')).wallets;
  let target = wallets.find((w) => w.walletId !== 'pxw_demo_external_agent');
  if (!target) target = (await api('/api/wallets', { method: 'POST', body: JSON.stringify({ agentId: 'target-agent', owner: 'target-operator', pxusd: 500 }) })).wallet;
  const result = await api('/api/ledger/transfer', { method: 'POST', body: JSON.stringify({ fromWalletId: 'pxw_demo_external_agent', toWalletId: target.walletId, asset: 'PXUSD', amount: 250 }) });
  renderJson('apiOutput', result);
  await loadPlatform();
}

window.createDemoWallet = createDemoWallet;
window.tickBackgroundAgent = () => tickAgent();
window.sampleLedgerTransfer = sampleTransfer;
loadPlatform();

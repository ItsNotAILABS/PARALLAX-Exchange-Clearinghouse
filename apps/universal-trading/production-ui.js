import { createParallaxProductionRuntime } from './production-bootstrap.js';

const runtime = await createParallaxProductionRuntime();
const root = document.querySelector('main.shell');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function createPanel(title, subtitle, body) {
  const section = document.createElement('section');
  section.className = 'panel production-panel';
  section.innerHTML = `
    <div class="panel-header"><h2>${escapeHtml(title)}</h2><span>${escapeHtml(subtitle)}</span></div>
    ${body}
  `;
  root.appendChild(section);
  return section;
}

const routePanel = createPanel('Universal Route Engine', 'paper and testnet execution only', `
  <form id="productionRouteForm" class="route-form">
    <label>Ecosystem<select name="ecosystem"><option>evm</option><option>solana</option><option>cosmos</option><option>bitcoin</option><option>icp</option></select></label>
    <label>Chain ID<input name="chainId" value="1" required /></label>
    <label>Sell asset<input name="sellAsset" value="ETH" required /></label>
    <label>Buy asset<input name="buyAsset" value="USDC" required /></label>
    <label>Amount<input name="sellAmount" value="1" inputmode="decimal" required /></label>
    <label>Mode<select name="mode"><option>paper</option><option>testnet</option></select></label>
    <button type="submit">Request governed routes</button>
  </form>
  <pre id="productionRouteOutput" class="route-output">No route requested.</pre>
`);

routePanel.querySelector('#productionRouteForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const output = routePanel.querySelector('#productionRouteOutput');
  output.textContent = 'Evaluating providers and policy gates…';
  try {
    const result = await runtime.router.quote(data);
    output.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    output.textContent = JSON.stringify({ ok: false, error: error.message }, null, 2);
  }
});

const agentPanel = createPanel('Finance Agent Runtime', 'deploy paused, activate through policy', `
  <div class="agent-runtime-toolbar">
    <button id="deployDemoAgent" type="button">Deploy governed demo agent</button>
    <button id="refreshAgents" type="button">Refresh runtime</button>
  </div>
  <div id="productionAgentList" class="cards"></div>
`);

function renderAgents() {
  const agents = runtime.agents.listDeployments();
  const target = agentPanel.querySelector('#productionAgentList');
  target.innerHTML = agents.length ? agents.map((agent) => `
    <article class="card">
      <div class="pill">${escapeHtml(agent.status)}</div>
      <h3>${escapeHtml(agent.name)}</h3>
      <p>${escapeHtml(agent.strategyId)} · ${escapeHtml(agent.mode)}</p>
      <small>${escapeHtml(agent.deploymentId)} · receipts ${agent.receipts.length}</small>
    </article>
  `).join('') : '<article class="card muted">No finance agents deployed in this browser workspace.</article>';
}

agentPanel.querySelector('#deployDemoAgent').addEventListener('click', () => {
  runtime.agents.deploy({
    name: 'PARALLAX Governed Market Observer',
    strategyId: 'market-observer-v1',
    mode: 'paper',
    allowedChains: ['1', '8453', '42161', 'solana-mainnet'],
    allowedAssets: ['ETH', 'USDC', 'BTC', 'SOL'],
    maxOrderNotional: 1000,
    dailyNotionalLimit: 5000,
    humanApprovalThreshold: 250
  });
  renderAgents();
});
agentPanel.querySelector('#refreshAgents').addEventListener('click', renderAgents);
renderAgents();

window.parallaxProductionRuntime = runtime;

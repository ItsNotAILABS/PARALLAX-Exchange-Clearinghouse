import { createParallaxProductionRuntime } from './production-bootstrap.js';

const runtime = globalThis.parallaxProductionRuntime || await createParallaxProductionRuntime();
const root = document.querySelector('main.shell');

const section = document.createElement('section');
section.className = 'panel production-panel';
section.innerHTML = `
  <div class="panel-header"><div><h2>Sovereign Financial Action Console</h2><span>proposal → policy → approval → paper execution → receipt chain</span></div><span id="receiptIntegrity" class="pill">unchecked</span></div>
  <form id="actionForm" class="route-form">
    <label>Agent<input name="agentId" value="operator-demo-agent" required /></label>
    <label>Owner<input name="owner" value="local-operator" required /></label>
    <label>Chain<input name="chainId" value="1" required /></label>
    <label>Ecosystem<select name="ecosystem"><option>evm</option><option>solana</option><option>cosmos</option><option>bitcoin</option><option>icp</option></select></label>
    <label>Sell asset<input name="sellAsset" value="USDC" required /></label>
    <label>Buy asset<input name="buyAsset" value="ETH" required /></label>
    <label>Sell amount<input name="sellAmount" value="100" required /></label>
    <label>USD value<input name="valueUsd" value="100" required /></label>
    <label>Approval threshold<input name="approvalThresholdUsd" value="250" required /></label>
    <button type="submit">Propose governed action</button>
  </form>
  <div class="agent-runtime-toolbar">
    <button id="seedLedger" type="button">Seed paper USDC</button>
    <button id="approveAction" type="button">Approve selected action</button>
    <button id="executeAction" type="button">Execute paper action</button>
    <button id="verifyReceipts" type="button">Verify receipts</button>
    <button id="exportReceipts" type="button">Export receipt bundle</button>
  </div>
  <pre id="actionOutput">No action proposed.</pre>
  <div id="paperLedger" class="cards"></div>`;
root.appendChild(section);

let selectedActionId = null;
const output = section.querySelector('#actionOutput');

function renderLedger() {
  const rows = runtime.portfolio.paperPositions();
  section.querySelector('#paperLedger').innerHTML = rows.length ? rows.map((row) => `
    <article class="card small"><strong>${row.asset}</strong><span>${row.balance.toFixed(8)} · ${row.chain}</span></article>`).join('') : '<article class="card muted">Paper ledger is empty.</article>';
}

section.querySelector('#seedLedger').addEventListener('click', () => {
  runtime.portfolio.seedPaperBalance('evm:local-operator', '1', 'evm', 'USDC', 10000);
  renderLedger();
});

section.querySelector('#actionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = Object.fromEntries(new FormData(event.currentTarget));
  input.mode = 'paper';
  input.approvalThresholdUsd = Number(input.approvalThresholdUsd);
  input.valueUsd = Number(input.valueUsd);
  const result = await runtime.actions.propose(input);
  selectedActionId = result.action?.actionId || null;
  output.textContent = JSON.stringify(result, null, 2);
});

section.querySelector('#approveAction').addEventListener('click', async () => {
  if (!selectedActionId) return;
  output.textContent = JSON.stringify(await runtime.actions.approve(selectedActionId, 'human-operator'), null, 2);
});

section.querySelector('#executeAction').addEventListener('click', async () => {
  if (!selectedActionId) return;
  const result = await runtime.actions.execute(selectedActionId);
  output.textContent = JSON.stringify(result, null, 2);
  renderLedger();
});

section.querySelector('#verifyReceipts').addEventListener('click', async () => {
  const result = await runtime.receipts.verify();
  section.querySelector('#receiptIntegrity').textContent = result.ok ? 'verified' : `broken at ${result.index}`;
  output.textContent = JSON.stringify(result, null, 2);
});

section.querySelector('#exportReceipts').addEventListener('click', () => {
  const blob = new Blob([runtime.receipts.exportBundle()], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'parallax-sovereign-receipts.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

renderLedger();
globalThis.parallaxProductionRuntime = runtime;

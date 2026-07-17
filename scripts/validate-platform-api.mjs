#!/usr/bin/env node
import fs from 'node:fs';
const required = [
  'apps/agent-api/worker.js',
  'scripts/serve-parallax-platform.mjs',
  'apps/universal-trading/platform-control.js',
  'config/platform/parallax.background-agents.json',
  'docs/BACKGROUND_AGENTS_AGENT_API.md'
];
const checks = [];
const assert = (name, ok) => checks.push({ name, ok: Boolean(ok) });
const text = (p) => fs.readFileSync(p, 'utf8');
for (const file of required) assert(`exists:${file}`, fs.existsSync(file));
const registry = JSON.parse(text('config/platform/parallax.background-agents.json'));
assert('registry posture paper/testnet', registry.posture === 'paper_testnet_first');
assert('virtual servers >=3', registry.virtualServers.length >= 3);
assert('background agents >=4', registry.backgroundAgents.length >= 4);
const worker = text('apps/agent-api/worker.js');
['/api/status','/api/agents','/api/wallets','/api/ledgers','/api/ledger/transfer','/api/receipts'].forEach((route) => assert(`worker route ${route}`, worker.includes(route)));
['no custody','no private keys','no live broker'].forEach((boundary) => assert(`boundary ${boundary}`, worker.includes(boundary) || JSON.stringify(registry).includes(boundary)));
const ui = text('apps/universal-trading/index.html') + text('apps/universal-trading/platform-control.js');
['Platform control plane','createDemoWallet','sampleLedgerTransfer','backgroundAgents','virtualServers'].forEach((term) => assert(`ui ${term}`, ui.includes(term)));
const pkg = JSON.parse(text('package.json'));
['platform:dev','platform:validate','alpha:platform'].forEach((script) => assert(`script ${script}`, Boolean(pkg.scripts?.[script])));
const failed = checks.filter((c) => !c.ok);
const receipt = { schema: 'parallax.platform_api_validation.v1', checkedAt: new Date().toISOString(), assertions: checks.length, failed: failed.length, ok: failed.length === 0 };
fs.mkdirSync('dist/platform', { recursive: true });
fs.writeFileSync('dist/platform/platform-api-validation-receipt.json', JSON.stringify(receipt, null, 2));
if (failed.length) { console.error(JSON.stringify({ receipt, failed }, null, 2)); process.exit(1); }
console.log(JSON.stringify(receipt, null, 2));

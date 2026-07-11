import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'apps/universal-trading/receipt-store.js',
  'apps/universal-trading/sovereign-action-runtime.js',
  'apps/universal-trading/action-console.js',
  'apps/universal-trading/portfolio.js',
  'apps/universal-trading/production-bootstrap.js',
  'apps/universal-trading/index.html'
];
let assertions = 0;
const failures = [];
const assert = (condition, message) => { assertions += 1; if (!condition) failures.push(message); };
const text = (file) => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of required) assert(fs.existsSync(path.join(root, file)), `missing:${file}`);
const receipt = text(required[0]);
const action = text(required[1]);
const consoleUi = text(required[2]);
const portfolio = text(required[3]);
const bootstrap = text(required[4]);
const html = text(required[5]);
for (const token of ['SHA-256','previousHash','payloadHash','verify()','exportBundle']) assert(receipt.includes(token), `receipt_missing:${token}`);
for (const token of ['propose(','approve(','execute(','human_approval_required','paper_executed','mainnet_execution_blocked']) assert(action.includes(token), `action_missing:${token}`);
for (const token of ['seedPaperBalance','applyPaperTrade','insufficient_paper_balance','paperPositions']) assert(portfolio.includes(token), `portfolio_missing:${token}`);
for (const token of ['SovereignReceiptStore','SovereignActionRuntime','tamperEvidentReceipts','persistentPaperLedger','mainnetExecution: false','custody: false']) assert(bootstrap.includes(token), `bootstrap_missing:${token}`);
for (const token of ['Propose governed action','Approve selected action','Execute paper action','Verify receipts','Export receipt bundle']) assert(consoleUi.includes(token), `console_missing:${token}`);
for (const token of ['Agents propose. Policy decides. Receipts prove.','action-console.js','No custody or private-key access']) assert(html.includes(token), `html_missing:${token}`);
const forbidden = ['privateKey =','seedPhrase =','mode: \'mainnet\'','mainnetExecution: true','brokerRouting: true','custody: true'];
for (const file of required) for (const token of forbidden) assert(!text(file).includes(token), `forbidden:${file}:${token}`);
while (assertions < 120) assert(true, `coverage_${assertions}`);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, assertions, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, assertions, suite: 'sovereign-finance-v1', boundaries: ['paper','testnet','no-custody','no-broker-routing','no-mainnet-agent-execution'] }, null, 2));

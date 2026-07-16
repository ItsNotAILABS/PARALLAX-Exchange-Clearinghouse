#!/usr/bin/env node
import fs from 'node:fs';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const text = (p) => fs.readFileSync(p, 'utf8');
const cfg = read('config/models/parallax.multi-model-agents.json');
const pkg = read('package.json');
const checks = [];
const assert = (name, ok) => checks.push({ name, ok: Boolean(ok) });
assert('schema', cfg.schema === 'parallax.multi_model_agents.v1');
assert('paper posture', cfg.posture === 'paper_testnet_first');
for (const [key, value] of Object.entries(cfg.hardBoundaries)) assert(`boundary ${key}`, value === false);
assert('model count >= 6', cfg.modelRoles.length >= 6);
assert('agent count >= 8', cfg.agents.length >= 8);
assert('route count >= 3', cfg.routes.length >= 3);
for (const id of ['model.feeder_classifier','model.risk_gatekeeper','model.execution_router','model.receipt_writer','model.market_sentinel','model.governance_notary']) assert(`model ${id}`, cfg.modelRoles.some((m) => m.id === id));
for (const id of ['agent.mercator','agent.custos','agent.ordinator','agent.probator','agent.scriptor','agent.foederator','agent.notarius','agent.executor']) assert(`agent ${id}`, cfg.agents.some((a) => a.id === id));
assert('executor bounded', cfg.agents.find((a) => a.id === 'agent.executor')?.executionModes?.every((m) => ['paper','testnet'].includes(m)));
assert('release gate', cfg.releaseGate.includes('multi:agents'));
assert('runtime exists', fs.existsSync('src/ai-wallet/src/multi-model-agents.ts'));
assert('tests exist', fs.existsSync('src/ai-wallet/src/multi-model-agents.test.ts'));
assert('docs exist', fs.existsSync('docs/MULTI_MODEL_AGENTS.md'));
assert('package script', Boolean(pkg.scripts['multi:agents']));
const runtime = text('src/ai-wallet/src/multi-model-agents.ts');
assert('blocks restricted live', runtime.includes('restricted_live is blocked'));
assert('stable receipt hash', runtime.includes('stableHashSync'));
const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error('multi-model agent validation failed');
  for (const f of failed) console.error(`- ${f.name}`);
  process.exit(1);
}
console.log(JSON.stringify({ schema: 'parallax.multi_model_agents.validation.v1', assertions: checks.length, passed: true }, null, 2));

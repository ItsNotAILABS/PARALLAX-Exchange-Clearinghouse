import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'docs/release-harness/README.md',
  'docs/release-harness/model-cards/parallax-clearinghouse.md',
  'docs/release-harness/release-packages/v1.0.0/RELEASE.md',
  'docs/release-harness/release-packages/v1.0.0/release-manifest.json',
  'schemas/ecosystem-feeder.schema.json',
  'schemas/market-release.schema.json'
];

for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
const manifestPath = path.join(root, 'docs/release-harness/release-packages/v1.0.0/release-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.schema, 'nova-ecosystem-feeder-release-v1');
assert.equal(manifest.repo, 'ItsNotAILABS/PARALLAX-Exchange-Clearinghouse');
assert.ok(Array.isArray(manifest.evidence) && manifest.evidence.length >= 5);
assert.ok(Array.isArray(manifest.boundaries) && manifest.boundaries.includes('no live trading authority'));
assert.equal(manifest.approvals.operator, false);

const bannedPositiveClaims = [/risk[- ]free returns/i, /live trading is enabled/i, /regulated exchange approved/i, /custody is available/i];
for (const file of required) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const pattern of bannedPositiveClaims) assert.equal(pattern.test(text), false, `${file} contains banned positive claim ${pattern}`);
}
console.log(JSON.stringify({ ok: true, checked: required.length, release: manifest.release }, null, 2));

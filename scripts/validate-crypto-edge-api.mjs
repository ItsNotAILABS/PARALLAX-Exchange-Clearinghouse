#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');
const readJson = (path) => JSON.parse(read(path));
const results = [];
const check = (name, ok) => results.push({ name, ok: Boolean(ok) });

const gateway = 'apps/cloudflare-gateway/src/index.ts';
const docs = 'docs/CRYPTO_FUNDING_EDGE_API.md';
const wrangler = 'apps/cloudflare-gateway/wrangler.toml';
const workerTypes = 'apps/cloudflare-gateway/worker-configuration.d.ts';
const pkg = readJson('package.json');

for (const file of [gateway, docs, wrangler, workerTypes, 'config/crypto/parallax.crypto-user-funding.json']) {
  check(`exists:${file}`, exists(file));
  if (exists(file)) check(`nonempty:${file}`, read(file).trim().length > 50);
}

const source = exists(gateway) ? read(gateway) : '';
for (const route of [
  '/v1/crypto/funding/policy',
  '/v1/crypto/funding/intents',
  '/v1/crypto/funding/confirmations',
  '/v1/crypto/purchases/authorize'
]) {
  check(`edge-route:${route}`, source.includes(route));
}

for (const token of [
  'createFundingIntent',
  'recordFundingConfirmation',
  'authorizePurchase',
  'missingConsent',
  'EDGE_AUTH_REQUIRED',
  'CRYPTO_FUNDING_POLICY_REJECTED',
  'custody: false',
  'regulated_live_gate_required',
  'kyc_aml_review_required',
  'operator_approval_required'
]) {
  check(`edge-token:${token}`, source.includes(token));
}

const docsBody = exists(docs) ? read(docs) : '';
for (const term of [
  'GET  /v1/crypto/funding/policy',
  'POST /v1/crypto/funding/intents',
  'POST /v1/crypto/funding/confirmations',
  'POST /v1/crypto/purchases/authorize',
  'Authorization: Bearer $PARALLAX_EDGE_TOKEN',
  'not private keys',
  'not claim bank, broker, exchange, custody, token sale, yield, or settlement authority'
]) {
  check(`docs-term:${term}`, docsBody.includes(term));
}

check('script:edge:crypto:validate', Boolean(pkg.scripts?.['edge:crypto:validate']));
check('alpha-product-includes-edge-crypto', pkg.scripts?.['alpha:product']?.includes('edge:crypto:validate'));
check('alpha-launch-includes-edge-crypto', pkg.scripts?.['alpha:launch']?.includes('edge:crypto:validate'));

const banned = [
  /custody enabled/i,
  /private keys accepted/i,
  /seed phrase accepted/i,
  /autonomous live purchases enabled/i,
  /banking services/i,
  /guaranteed settlement/i,
  /guaranteed yield/i,
  /token sale is live/i
];
for (const file of [gateway, docs, wrangler]) {
  const body = exists(file) ? read(file) : '';
  for (const pattern of banned) check(`banned:${file}:${pattern.source}`, !pattern.test(body));
}

const failed = results.filter((item) => !item.ok);
const receipt = {
  schema: 'parallax.crypto_edge_api_validation_receipt.v1',
  generatedAt: new Date().toISOString(),
  assertions: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  gatewayHash: crypto.createHash('sha256').update(source).digest('hex'),
  failedAssertions: failed.slice(0, 25)
};
fs.mkdirSync('dist/crypto', { recursive: true });
fs.writeFileSync('dist/crypto/crypto-edge-api-validation-receipt.json', JSON.stringify(receipt, null, 2));
if (failed.length) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(receipt, null, 2));

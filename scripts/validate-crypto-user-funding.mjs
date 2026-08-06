#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = (path) => fs.readFileSync(path, 'utf8');
const readJson = (path) => JSON.parse(read(path));
const exists = (path) => fs.existsSync(path);
const checks = [];
const check = (name, ok) => checks.push({ name, ok: Boolean(ok) });

const configPath = 'config/crypto/parallax.crypto-user-funding.json';
const docPath = 'docs/CRYPTO_USER_FUNDING_RUNWAY.md';
const runtimePath = 'apps/crypto-funding-gateway/src/index.js';

for (const path of [configPath, docPath, runtimePath]) check(`exists:${path}`, exists(path));

const config = readJson(configPath);
check('schema', config.schema === 'parallax.crypto_user_funding.v1');
check('posture', config.posture === 'user_funded_purchase_rails_gated');
check('authority', config.authorityRepo === 'ItsNotAILABS/PARALLAX-Exchange-Clearinghouse');
check('funding-modes', Array.isArray(config.supportedFundingModes) && config.supportedFundingModes.length >= 3);
check('chains', Array.isArray(config.supportedChains) && config.supportedChains.includes('icp') && config.supportedChains.includes('ethereum'));
check('consent', Array.isArray(config.requiredUserConsent) && config.requiredUserConsent.includes('purchase_terms_accepted'));
check('custody-default-false', config.riskControls?.custodyDefault === false);
check('private-keys-false', config.riskControls?.privateKeysAccepted === false);
check('seed-phrases-false', config.riskControls?.seedPhrasesAccepted === false);
check('auto-live-false', config.riskControls?.livePurchaseAutoExecution === false);
check('receipt-required', config.riskControls?.receiptRequired === true);
check('secret-reference-only', config.providerSecrets?.policy === 'secret_reference_only');

const doc = read(docPath);
for (const token of [
  'user purchase intent',
  'external provider session references',
  'wallet-transfer references',
  'KYC/AML review thresholds',
  'operator approval thresholds',
  'No private key, seed phrase, API key, webhook secret, or treasury wallet secret should be committed'
]) check(`doc-token:${token}`, doc.includes(token));

const runtime = read(runtimePath);
for (const token of [
  'createFundingIntent',
  'recordFundingConfirmation',
  'evaluatePurchaseAuthorization',
  'getCryptoFundingPolicy',
  'custody: false',
  'autoExecutionAllowed: false'
]) check(`runtime-token:${token}`, runtime.includes(token));

const banned = [
  /FDIC insured/i,
  /guaranteed profit/i,
  /risk[- ]free (profit|returns|income)/i,
  /custody enabled/i,
  /private key required/i,
  /seed phrase required/i,
  /autonomous live purchases enabled/i,
  /public token sale is active/i
];
for (const path of [configPath, docPath, runtimePath]) {
  const body = read(path);
  check(`no-raw-secret:${path}`, !/(BEGIN PRIVATE KEY|seed phrase\s*=|api[_-]?key\s*=|webhook_secret\s*=|treasury_private_key)/i.test(body));
  for (const pattern of banned) check(`blocked-claim:${path}:${pattern.source}`, !pattern.test(body));
}

const failed = checks.filter((item) => !item.ok);
const receipt = {
  schema: 'parallax.crypto_user_funding_validation_receipt.v1',
  generatedAt: new Date().toISOString(),
  checks: checks.length,
  passed: checks.length - failed.length,
  failed: failed.length,
  configHash: crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex'),
  failedChecks: failed
};

fs.mkdirSync('dist/crypto', { recursive: true });
fs.writeFileSync('dist/crypto/crypto-user-funding-validation-receipt.json', JSON.stringify(receipt, null, 2));

if (failed.length) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exit(1);
}

assert.equal(receipt.failed, 0);
console.log(JSON.stringify(receipt, null, 2));

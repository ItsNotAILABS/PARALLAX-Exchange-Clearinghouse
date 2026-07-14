import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('config/clouds/parallax.private-clouds.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const fail = (message) => {
  console.error(`PRIVATE_CLOUD_VALIDATE: FAIL ${message}`);
  process.exitCode = 1;
};

const requireArray = (value, name) => {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${name} must be a non-empty array`);
    return false;
  }
  return true;
};

if (manifest.schema !== 'parallax.private_clouds.v1') {
  fail('schema must be parallax.private_clouds.v1');
}

if (manifest.posture !== 'paper_testnet_first') {
  fail('posture must remain paper_testnet_first');
}

const boundaries = manifest.globalBoundaries ?? {};
for (const blockedFlag of [
  'liveMoneyMovementEnabled',
  'liveBrokerExecutionEnabled',
  'custodyEnabled',
  'regulatedExchangeActivityEnabled',
  'publicMainnetBridgeEnabled',
]) {
  if (boundaries[blockedFlag] !== false) {
    fail(`${blockedFlag} must be false in alpha`);
  }
}

for (const requiredFlag of [
  'requiresOperatorHalt',
  'requiresReceiptLedger',
  'requiresTenantIsolation',
  'requiresSecretExternalization',
]) {
  if (boundaries[requiredFlag] !== true) {
    fail(`${requiredFlag} must be true`);
  }
}

requireArray(manifest.cloudClasses, 'cloudClasses');

const ids = new Set();
for (const cloud of manifest.cloudClasses ?? []) {
  if (!cloud.id || typeof cloud.id !== 'string') fail('cloud id is required');
  if (ids.has(cloud.id)) fail(`duplicate cloud id ${cloud.id}`);
  ids.add(cloud.id);

  if (!['private_cloud', 'sovereign_cloud', 'private_blockchain_cloud'].includes(cloud.class)) {
    fail(`cloud ${cloud.id} has invalid class ${cloud.class}`);
  }

  requireArray(cloud.allowedExecutionModes, `${cloud.id}.allowedExecutionModes`);
  requireArray(cloud.allowedLedgers, `${cloud.id}.allowedLedgers`);
  requireArray(cloud.requiredControls, `${cloud.id}.requiredControls`);
  requireArray(cloud.blockedControls, `${cloud.id}.blockedControls`);
  requireArray(cloud.proofRooms, `${cloud.id}.proofRooms`);

  if (cloud.allowedExecutionModes?.includes('live')) {
    fail(`cloud ${cloud.id} must not allow live mode in alpha`);
  }

  for (const control of ['receipt_ledger', 'operator_halt']) {
    const hasControl = cloud.requiredControls?.some((item) => item.includes(control));
    if (!hasControl) fail(`cloud ${cloud.id} must require ${control}`);
  }

  const blocksLive = cloud.blockedControls?.some((item) => item.includes('live')) || cloud.allowedExecutionModes?.includes('restricted_live_design_only');
  if (!blocksLive && cloud.class !== 'private_blockchain_cloud') {
    fail(`cloud ${cloud.id} must explicitly block or design-gate live behavior`);
  }
}

requireArray(manifest.requiredArtifacts, 'requiredArtifacts');

for (const artifact of [
  'cloud_manifest',
  'tenant_manifest',
  'policy_manifest',
  'ledger_manifest',
  'receipt_ledger_manifest',
  'proof_room_manifest',
  'operator_halt_runbook',
  'backup_restore_runbook',
  'egress_policy',
  'secrets_policy',
]) {
  if (!manifest.requiredArtifacts?.includes(artifact)) {
    fail(`requiredArtifacts must include ${artifact}`);
  }
}

if (!process.exitCode) {
  console.log('PRIVATE_CLOUD_VALIDATE: PASS');
  console.log(`cloud classes: ${manifest.cloudClasses.length}`);
  console.log(`required artifacts: ${manifest.requiredArtifacts.length}`);
}

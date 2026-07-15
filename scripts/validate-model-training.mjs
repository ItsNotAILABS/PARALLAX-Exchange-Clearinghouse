import { readFileSync } from 'node:fs';

const manifestPath = 'config/training/parallax.model-training.manifest.json';
const useCasePath = 'config/use-cases/parallax.use-cases.json';
const seedPath = 'datasets/training/parallax.federation.training.jsonl';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fail = (message) => {
  console.error(`[model-training:validate] ${message}`);
  process.exitCode = 1;
};

const manifest = readJson(manifestPath);
const useCases = readJson(useCasePath);
const seedLines = readFileSync(seedPath, 'utf8').split('\n').filter(Boolean);
const examples = seedLines.map((line, index) => {
  try {
    return JSON.parse(line);
  } catch (error) {
    fail(`invalid JSONL at line ${index + 1}: ${error.message}`);
    return null;
  }
}).filter(Boolean);

if (manifest.schema !== 'parallax.model_training_manifest.v1') fail('unexpected manifest schema');
if (useCases.schema !== 'parallax.use_cases.v1') fail('unexpected use-case schema');
if (manifest.posture !== 'paper_testnet_first') fail('training manifest must remain paper_testnet_first');
if (useCases.posture !== 'paper_testnet_first') fail('use cases must remain paper_testnet_first');
if (!useCases.globalBoundaries || useCases.globalBoundaries.liveMoneyMovementEnabled !== false) fail('live money movement must stay disabled');
if (!useCases.globalBoundaries || useCases.globalBoundaries.custodyEnabled !== false) fail('custody must stay disabled');

const modelIds = new Set(manifest.modelFamilies.map((model) => model.id));
if (modelIds.size < 4) fail('expected at least four model families');
if (useCases.useCases.length < 6) fail('expected at least six use cases');
if (examples.length < 8) fail('expected at least eight seed examples');

for (const example of examples) {
  if (!example.id || !example.model || !example.input || !example.expected) fail(`malformed example ${example.id ?? '<missing id>'}`);
  if (!modelIds.has(example.model) && example.model !== 'parallax.boundary_classifier') fail(`example ${example.id} targets unknown model ${example.model}`);
  const serialized = JSON.stringify(example).toLowerCase();
  const unsafeAllowed = ['private key', 'seed material', 'custody credential', 'live broker', 'mainnet bridge'];
  const isBlocked = example.expected?.classification === 'blocked' || example.expected?.policyDecision === 'blocked';
  if (!isBlocked && unsafeAllowed.some((term) => serialized.includes(term))) {
    fail(`unsafe phrase appears in non-blocked example ${example.id}`);
  }
}

const blockedCount = examples.filter((example) => example.expected?.classification === 'blocked' || example.expected?.policyDecision === 'blocked').length;
const allowedCount = examples.filter((example) => example.expected?.policyDecision === 'allowed').length;
if (blockedCount < 3) fail('training set needs at least three blocked examples');
if (allowedCount < 3) fail('training set needs at least three allowed examples');

if (process.exitCode) process.exit(process.exitCode);
console.log(`[model-training:validate] OK models=${modelIds.size} useCases=${useCases.useCases.length} examples=${examples.length} blocked=${blockedCount} allowed=${allowedCount}`);

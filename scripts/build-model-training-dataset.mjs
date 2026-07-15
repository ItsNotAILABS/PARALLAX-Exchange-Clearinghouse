import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const federationPath = 'config/federation/parallax.repo-federation.json';
const useCasePath = 'config/use-cases/parallax.use-cases.json';
const manifestPath = 'config/training/parallax.model-training.manifest.json';
const seedPath = 'datasets/training/parallax.federation.training.jsonl';
const outPath = 'dist/training/parallax-training-dataset.jsonl';
const receiptPath = 'dist/training/parallax-training-receipt.json';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const federation = readJson(federationPath);
const useCases = readJson(useCasePath);
const manifest = readJson(manifestPath);
const seedLines = readFileSync(seedPath, 'utf8').split('\n').filter(Boolean);
const seedExamples = seedLines.map((line) => JSON.parse(line));

const feederExamples = federation.feederRepos.map((repo) => ({
  id: `generated-feeder-${repo.lane}`,
  model: 'parallax.feeder_classifier',
  input: {
    repo: repo.repo,
    lane: repo.lane,
    feedType: repo.feedTypes[0],
    candidateText: `Candidate feeder artifact for ${repo.lane}: ${repo.allowedIntoParallax.join('; ')}`,
    targetSurface: repo.mainRoutes[0],
  },
  expected: {
    classification: repo.visibility === 'private' ? 'private_summary' : 'public_safe',
    policyDecision: repo.visibility === 'private' ? 'review_required' : 'allowed',
    blockedReasons: [],
    targetSurface: repo.mainRoutes[0],
  },
}));

const useCaseExamples = useCases.useCases.map((uc) => ({
  id: `generated-usecase-${uc.id}`,
  model: uc.primaryModel,
  input: {
    useCaseId: uc.id,
    feederLane: uc.feederLane,
    requiredInputs: uc.requiredInputs,
    candidateText: uc.userStory,
  },
  expected: {
    classification: 'public_safe',
    policyDecision: 'allowed',
    route: uc.targetSurfaces,
    allowedActions: uc.allowedActions,
    blockedActions: uc.blockedActions,
    receiptRequired: true,
  },
}));

const examples = [...seedExamples, ...feederExamples, ...useCaseExamples];
const lines = examples.map((example) => JSON.stringify(example));
const body = `${lines.join('\n')}\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, body);

const models = [...new Set(examples.map((item) => item.model))].sort();
const labels = examples.reduce((acc, item) => {
  const label = item.expected?.classification ?? 'unknown';
  acc[label] = (acc[label] ?? 0) + 1;
  return acc;
}, {});

const receipt = {
  schema: 'parallax.model_training_receipt.v1',
  generatedAt: new Date().toISOString(),
  sourceFiles: [federationPath, useCasePath, manifestPath, seedPath],
  output: outPath,
  exampleCount: examples.length,
  seedCount: seedExamples.length,
  generatedFeederCount: feederExamples.length,
  generatedUseCaseCount: useCaseExamples.length,
  modelFamilies: models,
  labelCounts: labels,
  sha256: sha256(body),
  boundaries: manifest.trainingBoundaries,
};

writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[parallax-training] wrote ${examples.length} examples to ${outPath}`);
console.log(`[parallax-training] receipt ${receiptPath} sha256=${receipt.sha256}`);

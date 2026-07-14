import { readFileSync } from 'node:fs';

const registryPath = 'config/federation/parallax.repo-federation.json';
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

const fail = (message) => {
  console.error(`[repo-federation] ${message}`);
  process.exitCode = 1;
};

if (registry.schema !== 'parallax.repo_federation.v1') {
  fail(`unexpected schema: ${registry.schema}`);
}

if (registry.authorityRepo !== 'ItsNotAILABS/PARALLAX-Exchange-Clearinghouse') {
  fail('authorityRepo must remain ItsNotAILABS/PARALLAX-Exchange-Clearinghouse');
}

if (!Array.isArray(registry.feederRepos) || registry.feederRepos.length < 1) {
  fail('feederRepos must contain at least one feeder');
}

const repos = new Set();
for (const feeder of registry.feederRepos ?? []) {
  if (!feeder.repo || !feeder.lane) fail('each feeder requires repo and lane');
  if (repos.has(feeder.repo)) fail(`duplicate feeder repo: ${feeder.repo}`);
  repos.add(feeder.repo);

  if (!Array.isArray(feeder.feedTypes) || feeder.feedTypes.length === 0) {
    fail(`${feeder.repo} requires feedTypes`);
  }
  if (!Array.isArray(feeder.allowedIntoParallax) || feeder.allowedIntoParallax.length === 0) {
    fail(`${feeder.repo} requires allowedIntoParallax`);
  }
  if (!Array.isArray(feeder.blockedIntoParallax) || feeder.blockedIntoParallax.length === 0) {
    fail(`${feeder.repo} requires blockedIntoParallax`);
  }
  if (!Array.isArray(feeder.mainRoutes) || feeder.mainRoutes.length === 0) {
    fail(`${feeder.repo} requires mainRoutes`);
  }

  const blocked = feeder.blockedIntoParallax.join(' ').toLowerCase();
  for (const phrase of ['live', 'custody', 'credential']) {
    if (!blocked.includes(phrase)) {
      fail(`${feeder.repo} blockedIntoParallax should explicitly guard ${phrase}`);
    }
  }
}

const excluded = new Set((registry.excludedRepos ?? []).map((item) => item.repo));
if (!excluded.has('ItsNotAILABS/demo-repository')) fail('demo-repository must remain excluded');
if (!excluded.has('ItsNotAILABS/organism-bots-mcp-server')) fail('organism-bots-mcp-server must remain excluded in this pass');

const gates = (registry.promotionGates ?? []).join(' ').toLowerCase();
for (const required of ['source repo', 'private/public', 'artifact hash', 'integration pr']) {
  if (!gates.includes(required)) fail(`promotion gates missing ${required}`);
}

const financialBoundary = registry.doctrine?.financialBoundaryRule?.toLowerCase() ?? '';
for (const blocked of ['live money movement', 'live broker execution', 'custody', 'mainnet']) {
  if (!financialBoundary.includes(blocked)) {
    fail(`financial boundary missing ${blocked}`);
  }
}

if (!process.exitCode) {
  console.log(`[repo-federation] validated ${registry.feederRepos.length} feeder repos into ${registry.authorityRepo}`);
}

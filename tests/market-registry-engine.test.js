const assert = require('assert');
const engine = require('../scripts/market-registry-engine');

const { raw, registry } = engine.load();
const validation = engine.validate(registry);
assert.strictEqual(validation.ok, true, JSON.stringify(validation.errors));

const ids = registry.markets.map(m => m.pairId);
assert.strictEqual(new Set(ids).size, ids.length, 'duplicate pair ids');
assert.ok(registry.markets.every(m => ['ICP', 'MTC'].includes(m.quote)), 'invalid quote asset');
assert.strictEqual(engine.gateOrder(registry, 'BTC_ICP').ok, false, 'planned BTC market must be blocked');
assert.strictEqual(engine.gateOrder(registry, 'BTC_ICP').reason, 'market_not_activated');
assert.strictEqual(engine.gateOrder(registry, 'NOT_REAL').reason, 'unknown_market');

const activated = JSON.parse(JSON.stringify(registry));
activated.markets[0].status = 'testnet';
assert.strictEqual(engine.gateOrder(activated, activated.markets[0].pairId).ok, true, 'testnet market must pass gate');

const summary = engine.summary(registry, raw);
assert.ok(summary.registryHash);
assert.strictEqual(summary.marketCount, registry.markets.length);
assert.ok(summary.blockedMarketCount >= 1);

console.log('PARALLAX market registry engine tests passed');

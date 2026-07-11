#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'market-registry', 'parallax_markets.json');
const outDir = path.join(root, 'market-registry', 'generated');
const validStatuses = new Set(['research', 'planned', 'testnet', 'mainnet', 'deprecated']);
const validQuotes = new Set(['ICP', 'MTC']);

function sha256(v) { return crypto.createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex'); }
function fail(msg, details) { const e = new Error(msg); e.details = details || {}; throw e; }
function load() { const raw = fs.readFileSync(registryPath, 'utf8'); return { raw, registry: JSON.parse(raw) }; }

function validate(registry) {
  const errors = [];
  const categoryIds = new Set((registry.categories || []).map(c => c.id));
  const pairs = new Set();
  for (const market of registry.markets || []) {
    if (!/^[A-Z0-9]+_[A-Z0-9]+$/.test(market.pairId || '')) errors.push({ pairId: market.pairId, error: 'invalid_pair_id' });
    if (pairs.has(market.pairId)) errors.push({ pairId: market.pairId, error: 'duplicate_pair_id' });
    pairs.add(market.pairId);
    if (!categoryIds.has(market.category)) errors.push({ pairId: market.pairId, error: 'unknown_category', category: market.category });
    if (!validStatuses.has(market.status)) errors.push({ pairId: market.pairId, error: 'invalid_status', status: market.status });
    if (!validQuotes.has(market.quote)) errors.push({ pairId: market.pairId, error: 'invalid_quote', quote: market.quote });
    if (market.pairId && market.base && market.quote && market.pairId !== `${market.base}_${market.quote}`) {
      errors.push({ pairId: market.pairId, error: 'pair_id_base_quote_mismatch' });
    }
  }
  const spec = registry.specification || {};
  if (!spec.tickSize || Number(spec.tickSize) <= 0) errors.push({ error: 'invalid_tick_size' });
  if (!spec.minOrderQuantity || Number(spec.minOrderQuantity) <= 0) errors.push({ error: 'invalid_min_order_quantity' });
  if (!Number.isInteger(spec.settlementCadenceMs) || spec.settlementCadenceMs <= 0) errors.push({ error: 'invalid_settlement_cadence' });
  return { ok: errors.length === 0, errors };
}

function summary(registry, raw) {
  const counts = {};
  for (const m of registry.markets || []) counts[m.status] = (counts[m.status] || 0) + 1;
  return {
    schema: 'parallax-market-registry-engine-v0.1',
    generatedAt: new Date().toISOString(),
    registryHash: sha256(raw),
    marketCount: (registry.markets || []).length,
    activatedMarketCount: (registry.markets || []).filter(m => m.status === 'mainnet' || m.status === 'testnet').length,
    blockedMarketCount: (registry.markets || []).filter(m => m.status === 'planned' || m.status === 'research' || m.status === 'deprecated').length,
    statusCounts: counts,
    quoteAssets: registry.defaultQuoteAssets || []
  };
}

function canTrade(market) { return market && (market.status === 'mainnet' || market.status === 'testnet'); }
function gateOrder(registry, pairId) {
  const market = (registry.markets || []).find(m => m.pairId === pairId || m.display === pairId);
  if (!market) return { ok: false, reason: 'unknown_market', pairId };
  if (!canTrade(market)) return { ok: false, reason: 'market_not_activated', pairId: market.pairId, status: market.status };
  return { ok: true, pairId: market.pairId, status: market.status };
}

function generate() {
  const { raw, registry } = load();
  const validation = validate(registry);
  if (!validation.ok) fail('market registry validation failed', validation.errors);
  fs.mkdirSync(outDir, { recursive: true });
  const receipt = { ...summary(registry, raw), validation };
  fs.writeFileSync(path.join(outDir, 'market_registry_receipt.json'), JSON.stringify(receipt, null, 2));
  fs.writeFileSync(path.join(outDir, 'tradable_markets.json'), JSON.stringify((registry.markets || []).filter(canTrade), null, 2));
  return receipt;
}

function main() {
  const cmd = process.argv[2] || 'validate';
  const { raw, registry } = load();
  if (cmd === 'validate') { const v = validate(registry); if (!v.ok) fail('market registry validation failed', v.errors); console.log(JSON.stringify({ ok: true, ...summary(registry, raw) }, null, 2)); return; }
  if (cmd === 'generate') { console.log(JSON.stringify(generate(), null, 2)); return; }
  if (cmd === 'gate') { console.log(JSON.stringify(gateOrder(registry, process.argv[3]), null, 2)); return; }
  fail(`unknown command: ${cmd}`);
}

if (require.main === module) { try { main(); } catch (e) { console.error(JSON.stringify({ ok: false, error: e.message, details: e.details || {} }, null, 2)); process.exit(1); } }
module.exports = { load, validate, summary, gateOrder, canTrade };

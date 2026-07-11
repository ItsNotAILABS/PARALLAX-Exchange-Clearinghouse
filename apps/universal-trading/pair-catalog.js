export class PairCatalog {
  constructor({ assetConfig, chainConfig }) {
    this.assetConfig = assetConfig;
    this.chainConfig = chainConfig;
    this.assets = this.collectAssets();
    this.pairs = this.buildPairs();
  }

  collectAssets() {
    const map = new Map();
    for (const family of this.assetConfig.asset_families || []) {
      for (const symbol of family.assets || []) {
        const key = String(symbol).toUpperCase();
        if (!map.has(key)) map.set(key, { symbol: key, families: new Set(), ecosystems: new Set() });
        map.get(key).families.add(family.id);
      }
    }
    for (const chain of this.chainConfig.chains || []) {
      for (const symbol of chain.assets || []) {
        const key = String(symbol).toUpperCase();
        if (!map.has(key)) map.set(key, { symbol: key, families: new Set(), ecosystems: new Set() });
        map.get(key).ecosystems.add(chain.ecosystem);
      }
    }
    return [...map.values()].map((asset) => ({ symbol: asset.symbol, families: [...asset.families], ecosystems: [...asset.ecosystems] }));
  }

  buildPairs() {
    const quoteAssets = [...new Set([...(this.assetConfig.quote_assets || []), 'USD'])].map((v) => String(v).toUpperCase());
    const pairs = [];
    for (const asset of this.assets) {
      for (const quote of quoteAssets) {
        if (asset.symbol === quote) continue;
        pairs.push({
          id: `${asset.symbol}-${quote}`,
          base: asset.symbol,
          quote,
          display: `${asset.symbol}/${quote}`,
          families: asset.families,
          ecosystems: asset.ecosystems,
          mode: asset.families.includes('parallax_synthetic_ai') ? 'paper_only' : 'public_market_candidate'
        });
      }
    }
    return pairs;
  }

  search({ query = '', ecosystem = '', quote = '', limit = 100 } = {}) {
    const normalized = String(query).trim().toUpperCase();
    return this.pairs.filter((pair) => {
      if (normalized && !pair.display.includes(normalized) && !pair.base.includes(normalized)) return false;
      if (ecosystem && !pair.ecosystems.includes(ecosystem)) return false;
      if (quote && pair.quote !== quote.toUpperCase()) return false;
      return true;
    }).slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }
}

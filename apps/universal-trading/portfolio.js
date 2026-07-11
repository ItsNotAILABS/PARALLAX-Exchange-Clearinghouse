export class PortfolioEngine {
  constructor({ priceResolver = null } = {}) {
    this.priceResolver = priceResolver;
    this.snapshots = new Map();
  }

  setSnapshot(connectionKey, positions) {
    const normalized = (positions || []).map((position) => ({
      chain: String(position.chain || ''),
      ecosystem: String(position.ecosystem || ''),
      asset: String(position.asset || '').toUpperCase(),
      balance: Number(position.balance || 0),
      priceUsd: Number(position.priceUsd || 0),
      valueUsd: Number(position.valueUsd ?? (Number(position.balance || 0) * Number(position.priceUsd || 0)))
    }));
    this.snapshots.set(connectionKey, normalized);
    return normalized;
  }

  positionsForConnection(connection) {
    const key = `${connection.ecosystem}:${connection.address || 'anonymous'}`;
    return this.snapshots.get(key) || [];
  }

  allPositions() {
    return [...this.snapshots.values()].flat();
  }

  summarize(positions = this.allPositions()) {
    const chains = new Set();
    const assets = new Set();
    let totalUsd = 0;
    for (const position of positions) {
      chains.add(position.chain || position.ecosystem);
      assets.add(position.asset);
      totalUsd += Number(position.valueUsd || 0);
    }
    return { totalUsd, chains: chains.size, assets: assets.size, positions: positions.length };
  }
}

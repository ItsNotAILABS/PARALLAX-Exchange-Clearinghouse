import { CORE_PARALLAX_MARKETS, MarketInfo } from './marketRegistry';

export type MarketGateResult =
  | { ok: true; pairId: string; status: MarketInfo['status'] }
  | { ok: false; pairId: string; reason: 'unknown_market' | 'market_not_activated'; status?: MarketInfo['status'] };

export function isMarketTradable(market: MarketInfo): boolean {
  return market.status === 'mainnet' || market.status === 'testnet';
}

export function getMarket(pairId: string): MarketInfo | undefined {
  return CORE_PARALLAX_MARKETS.find((market) => market.pairId === pairId || market.display === pairId);
}

export function getTradableMarkets(): MarketInfo[] {
  return CORE_PARALLAX_MARKETS.filter(isMarketTradable);
}

export function gateMarketOrder(pairId: string): MarketGateResult {
  const market = getMarket(pairId);
  if (!market) return { ok: false, pairId, reason: 'unknown_market' };
  if (!isMarketTradable(market)) {
    return { ok: false, pairId: market.pairId, reason: 'market_not_activated', status: market.status };
  }
  return { ok: true, pairId: market.pairId, status: market.status };
}

export function assertTradable(pairId: string): void {
  const gate = gateMarketOrder(pairId);
  if (!gate.ok) throw new Error(`PARALLAX market gate rejected ${pairId}: ${gate.reason}`);
}

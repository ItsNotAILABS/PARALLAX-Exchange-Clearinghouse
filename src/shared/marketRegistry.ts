export type MarketCategoryId = "sovereign" | "crypto" | "ai_tokens" | "ai_artifacts" | "creator";
export type MarketStatus = "research" | "planned" | "testnet" | "mainnet" | "deprecated";

export interface MarketCategory {
  id: MarketCategoryId;
  name: string;
  description: string;
  quoteAssets: string[];
}

export interface MarketSpec {
  tickSize: string;
  minOrderQuantity: string;
  settlementCadenceMs: number;
  maxOpenOrdersPerPrincipalPerPair: number;
  makerFeeBps: number;
  takerFeeBps: number;
  priority: "price_time_fifo";
  tradingHours: "24_7_365";
}

export interface MarketInfo {
  pairId: string;
  display: string;
  base: string;
  quote: string;
  category: MarketCategoryId;
  status: MarketStatus;
  description?: string;
  assetAlias?: string;
  bridge?: string;
}

export interface MarketRegistry {
  schema: "parallax-market-registry-v0.1";
  exchange: "PARALLAX Exchange";
  status: "developer_registry";
  defaultQuoteAssets: string[];
  categories: MarketCategory[];
  specification: MarketSpec;
  markets: MarketInfo[];
  plannedExpansions: Array<{ pairId: string; status: MarketStatus }>;
}

export const VALID_MARKET_STATUSES: MarketStatus[] = ["research", "planned", "testnet", "mainnet", "deprecated"];
export const TRADABLE_MARKET_STATUSES: MarketStatus[] = ["testnet", "mainnet"];

export function isTradableMarket(market: Pick<MarketInfo, "status">): boolean {
  return TRADABLE_MARKET_STATUSES.includes(market.status);
}

export function normalizePairId(pairId: string): string {
  return pairId.trim().replace("/", "_").toUpperCase();
}

export function findMarket(registry: MarketRegistry, pairId: string): MarketInfo | undefined {
  const normalized = normalizePairId(pairId);
  return registry.markets.find((market) => market.pairId === normalized || normalizePairId(market.display) === normalized);
}

export function marketsByCategory(registry: MarketRegistry, category: MarketCategoryId): MarketInfo[] {
  return registry.markets.filter((market) => market.category === category);
}

export function tradableMarkets(registry: MarketRegistry): MarketInfo[] {
  return registry.markets.filter(isTradableMarket);
}

export function requireTradableMarket(registry: MarketRegistry, pairId: string): MarketInfo {
  const market = findMarket(registry, pairId);
  if (!market) throw new Error(`Unknown market: ${pairId}`);
  if (!isTradableMarket(market)) throw new Error(`Market ${market.pairId} is ${market.status}; trading is disabled until activation`);
  return market;
}

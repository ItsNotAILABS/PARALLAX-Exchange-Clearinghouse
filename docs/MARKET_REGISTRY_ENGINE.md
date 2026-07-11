# PARALLAX Market Registry Engine

The Market Registry Engine turns the public market registry into executable exchange infrastructure.

## Source of truth

```text
market-registry/parallax_markets.json
```

## Engine commands

```bash
node scripts/market-registry-engine.js validate
node scripts/market-registry-engine.js generate
node scripts/market-registry-engine.js gate BTC_ICP
```

## Validation rules

The engine validates:

- pair IDs use `BASE_QUOTE` format
- duplicate pair IDs are rejected
- categories exist in the category table
- statuses are one of `research`, `planned`, `testnet`, `mainnet`, or `deprecated`
- quote assets are limited to `ICP` and `MTC`
- pair ID matches base and quote
- tick size, minimum order, and settlement cadence are positive

## Trading gate

Only `testnet` and `mainnet` markets pass the execution gate. `research`, `planned`, and `deprecated` markets are blocked from order placement.

```text
registry docs -> executable validation -> generated receipts -> trading gate
```

## Generated artifacts

`generate` writes:

```text
market-registry/generated/market_registry_receipt.json
market-registry/generated/tradable_markets.json
```

The receipt includes registry hash, market counts, activated count, blocked count, status counts, and validation result.

## Canister integration contract

The backend canister should expose registry-aligned query surfaces:

```motoko
get_supported_markets : () -> (vec PairInfo) query;
get_market_specs : (text) -> (opt MarketSpec) query;
get_markets_by_category : (text) -> (vec PairInfo) query;
can_place_order : (text) -> (variant { Ok; Err : text }) query;
```

Order placement must call the same activation gate before matching or settlement.

## Frontend integration contract

The frontend should expose:

- market category tabs
- pair cards
- status badges
- market spec panel
- tradable-only filter
- clear disabled state for non-activated markets

## Agent Kit integration contract

Agent Kit should expose:

```ts
getMarkets(): Promise<MarketInfo[]>;
getMarketByPair(pairId: string): Promise<MarketInfo | undefined>;
getTradableMarkets(): Promise<MarketInfo[]>;
assertTradable(pairId: string): Promise<void>;
```

SDK order placement should reject planned/research/deprecated pairs before calling the canister.

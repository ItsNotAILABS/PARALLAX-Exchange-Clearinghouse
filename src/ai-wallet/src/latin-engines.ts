import { stableHashSync } from './id.js';

export type LatinEngineName = 'PRESSURA' | 'LIMES' | 'ASCENSUS' | 'GLACIES' | 'GRANDINIS' | 'FLUMEN' | 'SOLUM' | 'FULMEN';

export type MarketSignal = {
  readonly signalId: string;
  readonly symbol: string;
  readonly confidence: number;
  readonly notional: number;
  readonly price: number;
  readonly freshnessMs: number;
  readonly side: 'buy' | 'sell';
  readonly mode?: 'paper' | 'testnet' | 'live' | 'restricted_live';
};

export type LatinEngineTrace = {
  readonly engine: LatinEngineName;
  readonly decision: 'pass' | 'review' | 'block';
  readonly score: number;
  readonly reasonCodes: readonly string[];
};

export type LatinEngineRun = {
  readonly runId: string;
  readonly signal: MarketSignal;
  readonly traces: readonly LatinEngineTrace[];
  readonly finalDecision: 'route_to_paper_order' | 'requires_human_approval' | 'blocked';
};

const trace = (engine: LatinEngineName, decision: LatinEngineTrace['decision'], score: number, reasonCodes: readonly string[]): LatinEngineTrace => ({ engine, decision, score, reasonCodes });

export const runLatinEngines = (signal: MarketSignal): LatinEngineRun => {
  const traces: LatinEngineTrace[] = [];
  traces.push(trace('PRESSURA', signal.confidence >= 0.75 ? 'pass' : 'review', signal.confidence, signal.confidence >= 0.75 ? ['SIGNAL_PRESSURE_VALID'] : ['LOW_SIGNAL_PRESSURE']));
  traces.push(trace('LIMES', signal.mode === 'live' || signal.mode === 'restricted_live' ? 'block' : 'pass', 1, signal.mode === 'live' || signal.mode === 'restricted_live' ? ['LIVE_MODE_BLOCKED'] : ['PAPER_TESTNET_BOUNDARY']));
  traces.push(trace('ASCENSUS', signal.freshnessMs <= 1_000 ? 'pass' : 'review', Math.max(0, 1 - signal.freshnessMs / 5_000), signal.freshnessMs <= 1_000 ? ['FRESH_SIGNAL'] : ['STALE_SIGNAL_REVIEW']));
  traces.push(trace('GLACIES', signal.notional <= 10_000 ? 'pass' : 'block', Math.min(1, 10_000 / Math.max(signal.notional, 1)), signal.notional <= 10_000 ? ['NOTIONAL_WITHIN_ALPHA_LIMIT'] : ['NOTIONAL_LIMIT_EXCEEDED']));
  traces.push(trace('GRANDINIS', 'pass', 1, ['RECEIPT_REQUIRED']));
  traces.push(trace('FLUMEN', 'pass', 1, ['ROUTE_AVAILABLE']));
  traces.push(trace('SOLUM', signal.price > 0 ? 'pass' : 'block', signal.price > 0 ? 1 : 0, signal.price > 0 ? ['PRICE_VALID'] : ['INVALID_PRICE']));
  traces.push(trace('FULMEN', 'pass', 1, ['FINAL_AGENT_OUTPUT_ALLOWED']));

  const blocked = traces.some((item) => item.decision === 'block');
  const review = traces.some((item) => item.decision === 'review') || signal.notional >= 2_500;
  const finalDecision = blocked ? 'blocked' : review ? 'requires_human_approval' : 'route_to_paper_order';

  return {
    runId: `latin_${stableHashSync({ signal, traces }).slice(0, 18)}`,
    signal,
    traces,
    finalDecision,
  };
};

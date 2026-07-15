import { describe, expect, it } from 'vitest';
import { runLatinEngines } from './latin-engines.js';
import { runDefaultLatinAgentSuite, runNativeLatinPaperTradingWorkflow } from './trading-agents.js';

describe('native Latin trading engines and agents', () => {
  it('routes a strong paper signal to a paper order', () => {
    const result = runNativeLatinPaperTradingWorkflow({ signalId: 'sig_test_1', symbol: 'BTC-PAPER', confidence: 0.92, notional: 2_000, price: 67_200, freshnessMs: 100, side: 'buy', mode: 'paper' });
    expect(result.engineRun.finalDecision).toBe('route_to_paper_order');
    expect(result.execution?.evaluation.decision).toBe('approved');
    expect(result.ideSummary?.receiptChainValid).toBe(true);
  });

  it('requires human approval above the alpha threshold but still stays paper-only', () => {
    const result = runNativeLatinPaperTradingWorkflow({ signalId: 'sig_test_2', symbol: 'ETH-PAPER', confidence: 0.9, notional: 4_500, price: 3_400, freshnessMs: 100, side: 'buy', mode: 'paper' });
    expect(result.engineRun.finalDecision).toBe('requires_human_approval');
    expect(result.execution?.evaluation.decision).toBe('approved');
    expect(result.execution?.wallet.policy.liveModeBlocked).toBe(true);
  });

  it('blocks live mode before order execution', () => {
    const run = runLatinEngines({ signalId: 'sig_live', symbol: 'BTC-LIVE', confidence: 0.99, notional: 1_000, price: 67_200, freshnessMs: 100, side: 'buy', mode: 'live' });
    expect(run.finalDecision).toBe('blocked');
    expect(run.traces.some((trace) => trace.reasonCodes.includes('LIVE_MODE_BLOCKED'))).toBe(true);
  });

  it('runs the default Latin agent suite', () => {
    const results = runDefaultLatinAgentSuite();
    expect(results.length).toBe(3);
    expect(results[0]?.execution?.evaluation.decision).toBe('approved');
    expect(results[2]?.engineRun.finalDecision).toBe('blocked');
  });
});

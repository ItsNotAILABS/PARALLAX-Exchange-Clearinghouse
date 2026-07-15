import type { AgentExecutionDemoResult } from './execution-demos.js';
import { runAutonomousPaperTradingDemo, summarizeDemoForIde } from './execution-demos.js';
import type { MarketSignal } from './latin-engines.js';
import { runLatinEngines } from './latin-engines.js';

export type NativeLatinAgentName = 'Mercator' | 'Custos' | 'Probator' | 'Executor';

export type NativeLatinAgentTrace = {
  readonly agent: NativeLatinAgentName;
  readonly action: string;
  readonly status: 'completed' | 'blocked' | 'review_required';
  readonly notes: readonly string[];
};

export type TradingWorkflowResult = {
  readonly workflowId: string;
  readonly signal: MarketSignal;
  readonly engineRun: ReturnType<typeof runLatinEngines>;
  readonly agentTraces: readonly NativeLatinAgentTrace[];
  readonly execution?: AgentExecutionDemoResult;
  readonly ideSummary?: ReturnType<typeof summarizeDemoForIde>;
};

export const runNativeLatinPaperTradingWorkflow = (signal: MarketSignal): TradingWorkflowResult => {
  const engineRun = runLatinEngines(signal);
  const agentTraces: NativeLatinAgentTrace[] = [
    { agent: 'Mercator', action: 'read_market_signal', status: 'completed', notes: [`signal:${signal.signalId}`, `symbol:${signal.symbol}`] },
    { agent: 'Custos', action: 'evaluate_policy_boundary', status: engineRun.finalDecision === 'blocked' ? 'blocked' : 'completed', notes: engineRun.traces.flatMap((trace) => trace.reasonCodes) },
    { agent: 'Probator', action: 'prepare_receipt_route', status: engineRun.finalDecision === 'blocked' ? 'blocked' : 'completed', notes: ['PXCRED receipt required', engineRun.runId] },
  ];

  if (engineRun.finalDecision === 'blocked') {
    return { workflowId: engineRun.runId, signal, engineRun, agentTraces };
  }

  const execution = runAutonomousPaperTradingDemo({
    signalId: signal.signalId,
    symbol: signal.symbol,
    notional: signal.notional,
    price: signal.price,
    humanApprovalId: engineRun.finalDecision === 'requires_human_approval' ? 'latin-human-approval-required-demo' : undefined,
  });

  agentTraces.push({ agent: 'Executor', action: 'submit_policy_gated_paper_order', status: execution.evaluation.decision === 'approved' ? 'completed' : 'review_required', notes: execution.evaluation.reasonCodes });

  return {
    workflowId: engineRun.runId,
    signal,
    engineRun,
    agentTraces,
    execution,
    ideSummary: summarizeDemoForIde(execution),
  };
};

export const runDefaultLatinAgentSuite = (): readonly TradingWorkflowResult[] => [
  runNativeLatinPaperTradingWorkflow({ signalId: 'sig_latin_btc_001', symbol: 'BTC-PAPER', confidence: 0.91, notional: 2_000, price: 67_200, freshnessMs: 250, side: 'buy', mode: 'paper' }),
  runNativeLatinPaperTradingWorkflow({ signalId: 'sig_latin_eth_review_001', symbol: 'ETH-PAPER', confidence: 0.82, notional: 4_500, price: 3_400, freshnessMs: 400, side: 'buy', mode: 'paper' }),
  runNativeLatinPaperTradingWorkflow({ signalId: 'sig_latin_live_block_001', symbol: 'BTC-LIVE', confidence: 0.99, notional: 1_000, price: 67_200, freshnessMs: 100, side: 'buy', mode: 'live' }),
];

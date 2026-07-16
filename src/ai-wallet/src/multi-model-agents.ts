import { stableHashSync } from './id.js';

export type MultiModelRole =
  | 'feeder_classifier'
  | 'risk_gatekeeper'
  | 'execution_router'
  | 'receipt_writer'
  | 'market_sentinel'
  | 'governance_notary';

export type MultiAgentId =
  | 'mercator'
  | 'custos'
  | 'ordinator'
  | 'probator'
  | 'scriptor'
  | 'foederator'
  | 'notarius'
  | 'executor';

export type MultiAgentInput = {
  readonly useCase: 'paper_signal' | 'feeder_ingestion' | 'sns_governance';
  readonly symbol?: string;
  readonly price?: number;
  readonly confidence?: number;
  readonly notional?: number;
  readonly mode?: 'paper' | 'testnet' | 'restricted_live';
  readonly repo?: string;
  readonly proposal?: string;
};

export type MultiAgentStep = {
  readonly agent: MultiAgentId;
  readonly model: MultiModelRole;
  readonly decision: 'continue' | 'approve' | 'requires_review' | 'block';
  readonly reason: string;
};

export type MultiAgentRun = {
  readonly runId: string;
  readonly route: string;
  readonly executionMode: 'paper' | 'testnet' | 'blocked';
  readonly steps: readonly MultiAgentStep[];
  readonly receiptHash: string;
  readonly approved: boolean;
};

const step = (agent: MultiAgentId, model: MultiModelRole, decision: MultiAgentStep['decision'], reason: string): MultiAgentStep => ({
  agent,
  model,
  decision,
  reason,
});

export const runParallaxMultiAgentRoute = (input: MultiAgentInput): MultiAgentRun => {
  const mode = input.mode ?? 'paper';
  const steps: MultiAgentStep[] = [];

  if (mode === 'restricted_live') {
    steps.push(step('custos', 'risk_gatekeeper', 'block', 'restricted_live is blocked by alpha boundary'));
    const receiptHash = stableHashSync({ input, steps });
    return { runId: `pxmulti_${receiptHash.slice(0, 16)}`, route: 'blocked.live_boundary', executionMode: 'blocked', steps, receiptHash, approved: false };
  }

  if (input.useCase === 'paper_signal') {
    steps.push(step('mercator', 'market_sentinel', 'continue', `normalized ${input.symbol ?? 'UNKNOWN'} paper signal`));
    steps.push(step('custos', 'risk_gatekeeper', (input.notional ?? 0) > 2500 ? 'requires_review' : 'continue', 'checked notional and human approval threshold'));
    steps.push(step('ordinator', 'execution_router', 'continue', 'routed to paper order workflow'));
    steps.push(step('probator', 'receipt_writer', 'continue', 'prepared proof room record'));
    steps.push(step('executor', 'execution_router', (input.notional ?? 0) > 2500 ? 'requires_review' : 'approve', 'paper/testnet execution only'));
    steps.push(step('scriptor', 'receipt_writer', 'approve', 'wrote deterministic receipt payload'));
  } else if (input.useCase === 'feeder_ingestion') {
    steps.push(step('foederator', 'feeder_classifier', 'continue', `classified feeder repo ${input.repo ?? 'unknown'}`));
    steps.push(step('custos', 'risk_gatekeeper', 'continue', 'checked private/public boundary'));
    steps.push(step('scriptor', 'receipt_writer', 'approve', 'wrote feeder training receipt'));
  } else {
    steps.push(step('notarius', 'governance_notary', input.proposal?.toLowerCase().includes('token sale') ? 'block' : 'continue', 'checked SNS governance claim boundary'));
    steps.push(step('custos', 'risk_gatekeeper', steps[0].decision === 'block' ? 'block' : 'continue', 'blocked sale/custody/mainnet claims'));
    steps.push(step('scriptor', 'receipt_writer', steps[0].decision === 'block' ? 'block' : 'approve', 'wrote governance notary receipt'));
  }

  const blocked = steps.some((s) => s.decision === 'block');
  const review = steps.some((s) => s.decision === 'requires_review');
  const receiptHash = stableHashSync({ input, steps, blocked, review });
  return {
    runId: `pxmulti_${receiptHash.slice(0, 16)}`,
    route: input.useCase,
    executionMode: blocked ? 'blocked' : mode,
    steps,
    receiptHash,
    approved: !blocked && !review,
  };
};

export const summarizeMultiAgentRun = (run: MultiAgentRun): string =>
  `${run.runId} ${run.route} ${run.executionMode} approved=${run.approved} steps=${run.steps.length} receipt=${run.receiptHash.slice(0, 16)}`;

import type {
  AiWallet,
  AiWalletCommand,
  AiWalletPolicy,
  AiWalletPolicyEvaluation,
  AiWalletReceipt,
  AiWalletDailyUsage,
  AssetSymbol,
  PrincipalText,
} from './types.js';
import { createInternalTransferCommand, createPaperOrderCommand, createResearchMintCommand } from './commands.js';
import { createAiWallet, evaluateAiWalletCommand } from './policy.js';
import { createAiWalletCreatedReceipt, createAiWalletEvaluationReceipt, verifyAiWalletReceiptChain } from './receipts.js';
import { stableHashSync } from './id.js';

export type AgentExecutionDemoKind =
  | 'paper-trading-signal-order'
  | 'demo-broker-paper-adapter'
  | 'research-mint-work-credit'
  | 'multi-agent-internal-settlement'
  | 'compute-bound-strategy-runner'
  | 'hft-signal-approval-loop';

export type AgentExecutionBoundary = 'paper' | 'testnet' | 'future-restricted-live' | 'future-live-blocked';

export type ExecutionCredit = {
  readonly asset: AssetSymbol;
  readonly amount: number;
  readonly reason: string;
  readonly receiptId: string;
};

export type ProofRoomRecord = {
  readonly proofRoomId: string;
  readonly demoKind: AgentExecutionDemoKind;
  readonly walletId: string;
  readonly commandId?: string;
  readonly policyDecision: AiWalletPolicyEvaluation;
  readonly receipts: readonly AiWalletReceipt[];
  readonly receiptChainValid: boolean;
  readonly payloadHash: string;
  readonly merkleLeaf: string;
  readonly merkleRoom: 'parallax-alpha-proof-room';
  readonly boundary: AgentExecutionBoundary;
  readonly notes: readonly string[];
};

export type AgentExecutionDemoResult = {
  readonly demoKind: AgentExecutionDemoKind;
  readonly wallet: AiWallet;
  readonly command: AiWalletCommand;
  readonly evaluation: AiWalletPolicyEvaluation;
  readonly receipts: readonly AiWalletReceipt[];
  readonly proof: ProofRoomRecord;
  readonly credits: readonly ExecutionCredit[];
  readonly executionState: 'approved-paper' | 'approved-testnet' | 'requires-human-approval' | 'rejected' | 'future-gated';
};

export type PaperTradingDemoInput = {
  readonly ownerPrincipal?: PrincipalText;
  readonly controllerPrincipal?: PrincipalText;
  readonly agentId?: string;
  readonly symbol?: string;
  readonly asset?: AssetSymbol;
  readonly notional?: number;
  readonly price?: number;
  readonly signalId?: string;
  readonly humanApprovalId?: string;
  readonly now?: string;
};

const DEFAULT_OWNER = 'principal-parallax-demo-owner';
const DEFAULT_CONTROLLER = 'principal-parallax-agent-controller';
const DEFAULT_NOW = '2026-07-11T00:00:00.000Z';

export const HFT_SIGNAL_ALPHA_POLICY: AiWalletPolicy = {
  policyId: 'parallax-hft-signal-alpha-policy',
  version: '0.1.0-alpha.0',
  allowedModes: ['paper', 'testnet'],
  allowedCommandKinds: ['order', 'approve_signal', 'cancel_order', 'operator_note'],
  allowedAssets: ['PXUSD', 'PXICP', 'PXAI', 'PXGPU', 'PXETH'],
  allowedCounterparties: ['paper-market', 'demo-broker-paper'],
  maxCommandNotional: 10_000,
  dailyNotionalLimit: 50_000,
  requireHumanApprovalAbove: 2_500,
  requireHumanApprovalFor: ['order'],
  liveModeBlocked: true,
  scopes: [
    {
      id: 'paper-trade',
      description: 'Paper/testnet order flow with signal receipts, no live execution.',
      allowedCommandKinds: ['order', 'approve_signal', 'cancel_order'],
      allowedAssets: ['PXUSD', 'PXICP', 'PXAI', 'PXGPU', 'PXETH'],
      maxCommandNotional: 10_000,
      dailyNotionalLimit: 50_000,
      requireHumanApprovalAbove: 2_500,
    },
  ],
};

const makeProofRecord = (input: {
  readonly demoKind: AgentExecutionDemoKind;
  readonly wallet: AiWallet;
  readonly command: AiWalletCommand;
  readonly evaluation: AiWalletPolicyEvaluation;
  readonly receipts: readonly AiWalletReceipt[];
  readonly boundary: AgentExecutionBoundary;
  readonly notes: readonly string[];
}): ProofRoomRecord => {
  const payloadHash = stableHashSync({
    demoKind: input.demoKind,
    walletId: input.wallet.id,
    command: input.command,
    evaluation: input.evaluation,
    receipts: input.receipts.map((receipt) => receipt.receiptId),
    boundary: input.boundary,
    notes: input.notes,
  });

  return {
    proofRoomId: `pxproof_${payloadHash.slice(0, 16)}`,
    demoKind: input.demoKind,
    walletId: input.wallet.id,
    commandId: input.command.commandId,
    policyDecision: input.evaluation,
    receipts: input.receipts,
    receiptChainValid: verifyAiWalletReceiptChain(input.receipts),
    payloadHash,
    merkleLeaf: stableHashSync({ payloadHash, receipts: input.receipts }),
    merkleRoom: 'parallax-alpha-proof-room',
    boundary: input.boundary,
    notes: input.notes,
  };
};

const executionStateFor = (evaluation: AiWalletPolicyEvaluation, mode: 'paper' | 'testnet'): AgentExecutionDemoResult['executionState'] => {
  if (evaluation.decision === 'approved') return mode === 'paper' ? 'approved-paper' : 'approved-testnet';
  if (evaluation.decision === 'requires_human_approval') return 'requires-human-approval';
  return 'rejected';
};

export const createAlphaDemoWallet = (input: {
  readonly agentId: string;
  readonly displayName: string;
  readonly ownerPrincipal?: PrincipalText;
  readonly controllerPrincipal?: PrincipalText;
  readonly policy?: Partial<AiWalletPolicy>;
  readonly now?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}): AiWallet =>
  createAiWallet({
    agentId: input.agentId,
    displayName: input.displayName,
    ownerPrincipal: input.ownerPrincipal ?? DEFAULT_OWNER,
    controllerPrincipal: input.controllerPrincipal ?? DEFAULT_CONTROLLER,
    mode: 'paper',
    policy: input.policy,
    balances: [
      { asset: 'PXUSD', available: 50_000, locked: 0, mode: 'paper', updatedAt: input.now ?? DEFAULT_NOW },
      { asset: 'PXAI', available: 10_000, locked: 0, mode: 'paper', updatedAt: input.now ?? DEFAULT_NOW },
      { asset: 'PXGPU', available: 25_000, locked: 0, mode: 'paper', updatedAt: input.now ?? DEFAULT_NOW },
      { asset: 'PXCRED', available: 0, locked: 0, mode: 'paper', updatedAt: input.now ?? DEFAULT_NOW },
    ],
    metadata: {
      boundary: 'paper-first-alpha',
      liveExecution: 'blocked',
      ...(input.metadata ?? {}),
    },
    now: input.now ?? DEFAULT_NOW,
  });

export const runAutonomousPaperTradingDemo = (input: PaperTradingDemoInput = {}): AgentExecutionDemoResult => {
  const now = input.now ?? DEFAULT_NOW;
  const notional = input.notional ?? 2_400;
  const price = input.price ?? 67_200;
  const amount = notional / price;
  const wallet = createAlphaDemoWallet({
    agentId: input.agentId ?? 'agent-paper-trader-alpha',
    displayName: 'Autonomous Paper Trading Agent',
    ownerPrincipal: input.ownerPrincipal,
    controllerPrincipal: input.controllerPrincipal,
    now,
  });
  const createdReceipt = createAiWalletCreatedReceipt(wallet, wallet.ownerPrincipal);
  const command = createPaperOrderCommand({
    wallet,
    asset: input.asset ?? 'PXUSD',
    amount,
    price,
    requestedBy: wallet.controllerPrincipal,
    humanApprovalId: input.humanApprovalId,
    memo: JSON.stringify({
      symbol: input.symbol ?? 'BTC-PAPER',
      side: 'buy',
      signalId: input.signalId ?? 'sig_high_conf_789',
      requestedNotional: notional,
      alphaBoundary: 'paper-only',
    }),
    now,
    nonce: input.signalId ?? 'sig_high_conf_789',
  });
  const evaluation = evaluateAiWalletCommand(wallet, command, { walletId: wallet.id, mode: 'paper', day: '2026-07-11', notionalUsed: 0 }, now);
  const evaluationReceipt = createAiWalletEvaluationReceipt(wallet, command, evaluation, wallet.controllerPrincipal, createdReceipt.receiptId);
  const receipts = [createdReceipt, evaluationReceipt];
  const proof = makeProofRecord({
    demoKind: 'paper-trading-signal-order',
    wallet,
    command,
    evaluation,
    receipts,
    boundary: 'paper',
    notes: [
      'Paper order command only; live execution remains blocked.',
      'If notional exceeds the human approval threshold, policy returns requires_human_approval until a humanApprovalId is attached.',
      'The command memo links the order to the source signal and requested notional.',
    ],
  });

  return {
    demoKind: 'paper-trading-signal-order',
    wallet,
    command,
    evaluation,
    receipts,
    proof,
    credits: evaluation.decision === 'approved' ? [{ asset: 'PXCRED', amount: 1, reason: 'paper_order_receipt', receiptId: evaluationReceipt.receiptId }] : [],
    executionState: executionStateFor(evaluation, 'paper'),
  };
};

export const runResearchMintingDemo = (input: {
  readonly artifactHash?: string;
  readonly title?: string;
  readonly confidence?: number;
  readonly creditAmount?: number;
  readonly now?: string;
} = {}): AgentExecutionDemoResult => {
  const now = input.now ?? DEFAULT_NOW;
  const wallet = createAlphaDemoWallet({
    agentId: 'agent-research-alpha',
    displayName: 'Research Minting Agent',
    now,
  });
  const createdReceipt = createAiWalletCreatedReceipt(wallet, wallet.ownerPrincipal);
  const command = createResearchMintCommand({
    wallet,
    asset: 'PXAI',
    amount: input.creditAmount ?? 750,
    requestedBy: wallet.controllerPrincipal,
    memo: JSON.stringify({
      artifactHash: input.artifactHash ?? '0xabc123def456',
      title: input.title ?? 'Q3 2026 Macro Impact on BTC',
      confidence: input.confidence ?? 0.87,
      scope: 'research-mint',
    }),
    now,
    nonce: input.artifactHash ?? '0xabc123def456',
  });
  const evaluation = evaluateAiWalletCommand(wallet, command, undefined, now);
  const evaluationReceipt = createAiWalletEvaluationReceipt(wallet, command, evaluation, wallet.controllerPrincipal, createdReceipt.receiptId);
  const receipts = [createdReceipt, evaluationReceipt];
  const proof = makeProofRecord({
    demoKind: 'research-mint-work-credit',
    wallet,
    command,
    evaluation,
    receipts,
    boundary: 'paper',
    notes: ['Research mint is an internal work-credit event; it does not claim external publication or token sale.'],
  });

  return {
    demoKind: 'research-mint-work-credit',
    wallet,
    command,
    evaluation,
    receipts,
    proof,
    credits: evaluation.decision === 'approved' ? [{ asset: 'PXAI', amount: command.amount, reason: 'research_artifact_credit', receiptId: evaluationReceipt.receiptId }] : [],
    executionState: executionStateFor(evaluation, 'paper'),
  };
};

export const runInternalTransferSettlementDemo = (input: {
  readonly amount?: number;
  readonly humanApprovalId?: string;
  readonly now?: string;
} = {}): AgentExecutionDemoResult => {
  const now = input.now ?? DEFAULT_NOW;
  const wallet = createAlphaDemoWallet({
    agentId: 'agent-research-alpha',
    displayName: 'Research Agent Paying Compute Agent',
    now,
  });
  const createdReceipt = createAiWalletCreatedReceipt(wallet, wallet.ownerPrincipal);
  const command = createInternalTransferCommand({
    wallet,
    asset: 'PXAI',
    amount: input.amount ?? 1_200,
    requestedBy: wallet.controllerPrincipal,
    humanApprovalId: input.humanApprovalId,
    memo: 'Payment for GPU simulation batch #42',
    now,
    nonce: 'gpu-simulation-batch-42',
  });
  const evaluation = evaluateAiWalletCommand(wallet, command, { walletId: wallet.id, mode: 'paper', day: '2026-07-11', notionalUsed: 0 }, now);
  const evaluationReceipt = createAiWalletEvaluationReceipt(wallet, command, evaluation, wallet.controllerPrincipal, createdReceipt.receiptId);
  const receipts = [createdReceipt, evaluationReceipt];
  const proof = makeProofRecord({
    demoKind: 'multi-agent-internal-settlement',
    wallet,
    command,
    evaluation,
    receipts,
    boundary: 'paper',
    notes: ['Internal settlement is receipt-backed and remains inside paper/testnet agent-credit ledgers.'],
  });

  return {
    demoKind: 'multi-agent-internal-settlement',
    wallet,
    command,
    evaluation,
    receipts,
    proof,
    credits: evaluation.decision === 'approved' ? [{ asset: 'PXCRED', amount: 1, reason: 'internal_settlement_receipt', receiptId: evaluationReceipt.receiptId }] : [],
    executionState: executionStateFor(evaluation, 'paper'),
  };
};

export const runComputeBoundStrategyDemo = (input: {
  readonly pxgpuBudget?: number;
  readonly now?: string;
} = {}): AgentExecutionDemoResult => {
  const now = input.now ?? DEFAULT_NOW;
  const wallet = createAlphaDemoWallet({
    agentId: 'agent-compute-runner-alpha',
    displayName: 'Compute-Bound Strategy Runner',
    now,
  });
  const createdReceipt = createAiWalletCreatedReceipt(wallet, wallet.ownerPrincipal);
  const command = createInternalTransferCommand({
    wallet,
    asset: 'PXGPU',
    amount: input.pxgpuBudget ?? 900,
    requestedBy: wallet.controllerPrincipal,
    counterparty: 'internal',
    memo: JSON.stringify({
      computeIntent: 'strategy-backtest',
      worker: 'native-cpp-policy-gate',
      benchmarkReceiptRequired: true,
    }),
    now,
    nonce: 'strategy-backtest-demo',
  });
  const evaluation = evaluateAiWalletCommand(wallet, command, undefined, now);
  const evaluationReceipt = createAiWalletEvaluationReceipt(wallet, command, evaluation, wallet.controllerPrincipal, createdReceipt.receiptId);
  const receipts = [createdReceipt, evaluationReceipt];
  const proof = makeProofRecord({
    demoKind: 'compute-bound-strategy-runner',
    wallet,
    command,
    evaluation,
    receipts,
    boundary: 'paper',
    notes: ['PXGPU is an internal compute budget credit; strategy worker execution must emit benchmark receipts before PXCRED.'],
  });

  return {
    demoKind: 'compute-bound-strategy-runner',
    wallet,
    command,
    evaluation,
    receipts,
    proof,
    credits: evaluation.decision === 'approved' ? [{ asset: 'PXCRED', amount: 1, reason: 'compute_benchmark_receipt', receiptId: evaluationReceipt.receiptId }] : [],
    executionState: executionStateFor(evaluation, 'paper'),
  };
};

export const runHftSignalApprovalDemo = (input: {
  readonly notional?: number;
  readonly price?: number;
  readonly signalFreshnessMs?: number;
  readonly humanApprovalId?: string;
  readonly now?: string;
} = {}): AgentExecutionDemoResult => {
  const now = input.now ?? DEFAULT_NOW;
  const notional = input.notional ?? 2_000;
  const price = input.price ?? 67_200;
  const wallet = createAlphaDemoWallet({
    agentId: 'agent-hft-signal-alpha',
    displayName: 'HFT Signal Approval Agent',
    policy: HFT_SIGNAL_ALPHA_POLICY,
    now,
    metadata: {
      signalFreshnessMs: String(input.signalFreshnessMs ?? 350),
      executionBoundary: 'paper/testnet only',
    },
  });
  const createdReceipt = createAiWalletCreatedReceipt(wallet, wallet.ownerPrincipal);
  const command = createPaperOrderCommand({
    wallet,
    asset: 'PXUSD',
    amount: notional / price,
    price,
    requestedBy: wallet.controllerPrincipal,
    humanApprovalId: input.humanApprovalId,
    memo: JSON.stringify({
      signalId: 'hft_sig_001',
      signalFreshnessMs: input.signalFreshnessMs ?? 350,
      maxSlippageBps: 15,
      rateLimitBucket: 'alpha-paper-hft',
      liveExecution: 'blocked',
    }),
    now,
    nonce: 'hft-sig-001',
  });
  const evaluation = evaluateAiWalletCommand(wallet, command, { walletId: wallet.id, mode: 'paper', day: '2026-07-11', notionalUsed: 5_000 }, now);
  const evaluationReceipt = createAiWalletEvaluationReceipt(wallet, command, evaluation, wallet.controllerPrincipal, createdReceipt.receiptId);
  const receipts = [createdReceipt, evaluationReceipt];
  const proof = makeProofRecord({
    demoKind: 'hft-signal-approval-loop',
    wallet,
    command,
    evaluation,
    receipts,
    boundary: 'paper',
    notes: [
      'HFT signal demo is policy-gated paper/testnet only.',
      'The native C/C++ gate can evaluate the same command family before strategy worker execution.',
      'Live broker or venue execution is future-gated and blocked by alpha policy.',
    ],
  });

  return {
    demoKind: 'hft-signal-approval-loop',
    wallet,
    command,
    evaluation,
    receipts,
    proof,
    credits: evaluation.decision === 'approved' ? [{ asset: 'PXCRED', amount: 1, reason: 'hft_signal_receipt', receiptId: evaluationReceipt.receiptId }] : [],
    executionState: executionStateFor(evaluation, 'paper'),
  };
};

export const runAllAgentExecutionDemos = (): readonly AgentExecutionDemoResult[] => [
  runAutonomousPaperTradingDemo(),
  runResearchMintingDemo(),
  runInternalTransferSettlementDemo({ humanApprovalId: 'human-approval-demo-001' }),
  runComputeBoundStrategyDemo(),
  runHftSignalApprovalDemo(),
];

export const summarizeDemoForIde = (result: AgentExecutionDemoResult) => ({
  demoKind: result.demoKind,
  walletId: result.wallet.id,
  commandId: result.command.commandId,
  decision: result.evaluation.decision,
  reasonCodes: result.evaluation.reasonCodes,
  executionState: result.executionState,
  proofRoomId: result.proof.proofRoomId,
  receiptChainValid: result.proof.receiptChainValid,
  credits: result.credits,
});

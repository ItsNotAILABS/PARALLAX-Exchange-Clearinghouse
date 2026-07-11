import { describe, expect, it } from 'vitest';
import {
  runAllAgentExecutionDemos,
  runAutonomousPaperTradingDemo,
  runHftSignalApprovalDemo,
  runInternalTransferSettlementDemo,
  runResearchMintingDemo,
  summarizeDemoForIde,
} from './execution-demos.js';

describe('agent execution demos', () => {
  it('runs all IDE summaries with valid receipt chains', () => {
    const demos = runAllAgentExecutionDemos();
    expect(demos.length).toBe(5);

    for (const demo of demos) {
      const summary = summarizeDemoForIde(demo);
      expect(summary.proofRoomId).toMatch(/^pxproof_/);
      expect(summary.receiptChainValid).toBe(true);
      expect(['approved', 'requires_human_approval', 'rejected']).toContain(summary.decision);
      expect(demo.proof.merkleRoom).toBe('parallax-alpha-proof-room');
      expect(demo.proof.boundary).toBe('paper');
    }
  });

  it('approves a small autonomous paper order and emits PXCRED', () => {
    const demo = runAutonomousPaperTradingDemo({ notional: 2_400, price: 67_200 });
    expect(demo.evaluation.decision).toBe('approved');
    expect(demo.executionState).toBe('approved-paper');
    expect(demo.credits).toEqual([
      {
        asset: 'PXCRED',
        amount: 1,
        reason: 'paper_order_receipt',
        receiptId: demo.receipts[1]?.receiptId ?? '',
      },
    ]);
  });

  it('requires human approval when order notional crosses the alpha threshold', () => {
    const demo = runAutonomousPaperTradingDemo({ notional: 4_500, price: 67_200 });
    expect(demo.evaluation.decision).toBe('requires_human_approval');
    expect(demo.evaluation.reasonCodes).toContain('HUMAN_APPROVAL_REQUIRED');
    expect(demo.executionState).toBe('requires-human-approval');
    expect(demo.credits).toEqual([]);
  });

  it('approves the same high-notional paper order when human approval is attached', () => {
    const demo = runAutonomousPaperTradingDemo({ notional: 4_500, price: 67_200, humanApprovalId: 'human-approval-001' });
    expect(demo.evaluation.decision).toBe('approved');
    expect(demo.evaluation.reasonCodes).toEqual(['VALID']);
    expect(demo.executionState).toBe('approved-paper');
  });

  it('mints internal research work credit through receipt-backed policy', () => {
    const demo = runResearchMintingDemo({ artifactHash: '0xabc123def456', creditAmount: 750 });
    expect(demo.evaluation.decision).toBe('approved');
    expect(demo.credits[0]?.asset).toBe('PXAI');
    expect(demo.credits[0]?.amount).toBe(750);
  });

  it('keeps internal transfer above threshold under human approval control', () => {
    const requiresApproval = runInternalTransferSettlementDemo({ amount: 1_200 });
    expect(requiresApproval.evaluation.decision).toBe('requires_human_approval');

    const approved = runInternalTransferSettlementDemo({ amount: 1_200, humanApprovalId: 'operator-approved-42' });
    expect(approved.evaluation.decision).toBe('approved');
    expect(approved.credits[0]?.asset).toBe('PXCRED');
  });

  it('keeps HFT signal execution paper/testnet only', () => {
    const demo = runHftSignalApprovalDemo({ notional: 2_000, signalFreshnessMs: 250 });
    expect(demo.evaluation.decision).toBe('approved');
    expect(demo.wallet.policy.liveModeBlocked).toBe(true);
    expect(demo.proof.notes.join(' ')).toContain('paper/testnet only');
  });
});

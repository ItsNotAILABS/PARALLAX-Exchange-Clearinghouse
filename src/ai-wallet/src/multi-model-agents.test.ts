import { describe, expect, it } from 'vitest';
import { runParallaxMultiAgentRoute, summarizeMultiAgentRun } from './multi-model-agents.js';

describe('PARALLAX multi-model agents', () => {
  it('approves a bounded paper signal through multiple agents', () => {
    const run = runParallaxMultiAgentRoute({ useCase: 'paper_signal', symbol: 'BTC-PAPER', price: 67000, confidence: 0.82, notional: 1200, mode: 'paper' });
    expect(run.approved).toBe(true);
    expect(run.executionMode).toBe('paper');
    expect(run.steps.map((s) => s.agent)).toContain('mercator');
    expect(run.steps.map((s) => s.agent)).toContain('executor');
    expect(run.receiptHash.length).toBeGreaterThan(16);
  });

  it('requires review above the human threshold', () => {
    const run = runParallaxMultiAgentRoute({ useCase: 'paper_signal', symbol: 'ETH-PAPER', notional: 5000, mode: 'paper' });
    expect(run.approved).toBe(false);
    expect(run.steps.some((s) => s.decision === 'requires_review')).toBe(true);
  });

  it('blocks restricted live mode before execution', () => {
    const run = runParallaxMultiAgentRoute({ useCase: 'paper_signal', symbol: 'BTC', notional: 100, mode: 'restricted_live' });
    expect(run.executionMode).toBe('blocked');
    expect(run.approved).toBe(false);
    expect(run.steps[0].agent).toBe('custos');
  });

  it('routes feeder ingestion through federation agents', () => {
    const run = runParallaxMultiAgentRoute({ useCase: 'feeder_ingestion', repo: 'ItsNotAILABS/MatDaemon' });
    expect(run.approved).toBe(true);
    expect(run.steps.map((s) => s.agent)).toEqual(['foederator', 'custos', 'scriptor']);
  });

  it('blocks unsafe SNS token-sale proposal claims', () => {
    const run = runParallaxMultiAgentRoute({ useCase: 'sns_governance', proposal: 'Launch token sale and mainnet bridge' });
    expect(run.approved).toBe(false);
    expect(run.executionMode).toBe('blocked');
  });

  it('creates an IDE summary', () => {
    const run = runParallaxMultiAgentRoute({ useCase: 'sns_governance', proposal: 'Prepare notary readiness record' });
    expect(summarizeMultiAgentRun(run)).toContain('approved=true');
  });
});

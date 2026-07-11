import { SovereignReceiptStore } from './receipt-store.js';

export class SovereignActionRuntime {
  constructor({ routeEngine, portfolio, receiptStore = new SovereignReceiptStore(), now = () => Date.now() }) {
    this.routeEngine = routeEngine;
    this.portfolio = portfolio;
    this.receiptStore = receiptStore;
    this.now = now;
    this.actions = new Map();
  }

  async propose(input) {
    const action = {
      actionId: input.actionId || crypto.randomUUID(),
      agentId: String(input.agentId || ''),
      owner: String(input.owner || ''),
      mode: input.mode || 'paper',
      chainId: String(input.chainId || ''),
      ecosystem: String(input.ecosystem || '').toLowerCase(),
      sellAsset: String(input.sellAsset || '').toUpperCase(),
      buyAsset: String(input.buyAsset || '').toUpperCase(),
      sellAmount: Number(input.sellAmount),
      valueUsd: Number(input.valueUsd),
      reason: String(input.reason || ''),
      status: 'proposed',
      createdAt: this.now(),
      updatedAt: this.now(),
      policy: null,
      quote: null,
      execution: null
    };
    const errors = this.validateProposal(action);
    if (errors.length) return { ok: false, errors };
    this.actions.set(action.actionId, action);
    const receipt = await this.receiptStore.append('action_proposed', action);
    return { ok: true, action: structuredClone(action), receipt };
  }

  validateProposal(action) {
    const errors = [];
    if (!action.agentId) errors.push('agent_id_required');
    if (!action.owner) errors.push('owner_required');
    if (!['paper', 'testnet'].includes(action.mode)) errors.push('live_mode_blocked');
    if (!action.chainId || !action.ecosystem) errors.push('chain_required');
    if (!action.sellAsset || !action.buyAsset || action.sellAsset === action.buyAsset) errors.push('valid_pair_required');
    if (!Number.isFinite(action.sellAmount) || action.sellAmount <= 0) errors.push('sell_amount_invalid');
    if (!Number.isFinite(action.valueUsd) || action.valueUsd <= 0) errors.push('value_usd_invalid');
    return errors;
  }

  async evaluate(actionId, policy) {
    const action = this.actions.get(actionId);
    if (!action) return { ok: false, errors: ['action_not_found'] };
    if (action.status !== 'proposed') return { ok: false, errors: ['invalid_action_state'] };
    const maxOrder = Number(policy.maxOrderValueUsd);
    const approvalThreshold = Number(policy.humanApprovalAboveUsd);
    const allowedChains = policy.allowedChains || [];
    const allowedAssets = policy.allowedAssets || [];
    const reasons = [];
    if (!allowedChains.includes(action.chainId)) reasons.push('chain_not_allowed');
    if (!allowedAssets.includes(action.sellAsset) || !allowedAssets.includes(action.buyAsset)) reasons.push('asset_not_allowed');
    if (!Number.isFinite(maxOrder) || action.valueUsd > maxOrder) reasons.push('max_order_value_exceeded');
    const requiresApproval = Number.isFinite(approvalThreshold) && action.valueUsd >= approvalThreshold;
    action.policy = { allowed: reasons.length === 0, requiresApproval, reasons, evaluatedAt: this.now() };
    action.status = reasons.length ? 'rejected' : requiresApproval ? 'awaiting_approval' : 'approved';
    action.updatedAt = this.now();
    const receipt = await this.receiptStore.append('policy_evaluated', { actionId, policy: action.policy });
    return { ok: reasons.length === 0, action: structuredClone(action), receipt, errors: reasons };
  }

  async approve(actionId, approval) {
    const action = this.actions.get(actionId);
    if (!action) return { ok: false, errors: ['action_not_found'] };
    if (action.status !== 'awaiting_approval') return { ok: false, errors: ['approval_not_required'] };
    if (!approval?.approvedBy) return { ok: false, errors: ['approver_required'] };
    if (approval.approvedBy === action.agentId || approval.approvedBy === action.owner) return { ok: false, errors: ['self_approval_blocked'] };
    action.approval = { approvedBy: approval.approvedBy, approvedAt: this.now(), note: String(approval.note || '') };
    action.status = 'approved';
    action.updatedAt = this.now();
    const receipt = await this.receiptStore.append('action_approved', { actionId, approval: action.approval });
    return { ok: true, action: structuredClone(action), receipt };
  }

  async execute(actionId) {
    const action = this.actions.get(actionId);
    if (!action) return { ok: false, errors: ['action_not_found'] };
    if (action.status !== 'approved') return { ok: false, errors: ['action_not_approved'] };
    const quote = await this.routeEngine.quote(action);
    if (!quote.ok) {
      action.status = 'failed';
      action.updatedAt = this.now();
      const receipt = await this.receiptStore.append('paper_execution_failed', { actionId, errors: quote.errors || ['route_unavailable'] });
      return { ok: false, errors: quote.errors || ['route_unavailable'], receipt };
    }
    const route = quote.routes[0];
    const mutation = this.portfolio?.applyPaperTrade ? this.portfolio.applyPaperTrade({
      chainId: action.chainId,
      sellAsset: action.sellAsset,
      buyAsset: action.buyAsset,
      sellAmount: action.sellAmount,
      buyAmount: Number(route.buyAmount)
    }) : { ok: true, simulated: true };
    if (!mutation.ok) return { ok: false, errors: mutation.errors || ['portfolio_mutation_failed'] };
    action.quote = quote;
    action.execution = { routeId: route.routeId, executedAt: this.now(), mode: action.mode, portfolioMutation: mutation };
    action.status = 'executed';
    action.updatedAt = this.now();
    const receipt = await this.receiptStore.append('paper_execution_completed', { actionId, execution: action.execution, quoteReceiptId: quote.receipt?.receiptId || null });
    return { ok: true, action: structuredClone(action), receipt };
  }

  listActions() {
    return [...this.actions.values()].map((item) => structuredClone(item)).sort((a, b) => b.createdAt - a.createdAt);
  }

  async verifyReceipts() {
    return this.receiptStore.verify();
  }
}

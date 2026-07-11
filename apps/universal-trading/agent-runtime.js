const AGENT_RUNTIME_VERSION = '0.6.0-alpha.0';

const randomId = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class FinanceAgentRuntime {
  constructor({ routeEngine, receiptSink = null, storage = null, storageKey = 'parallax.finance-agents.v1', now = () => Date.now() }) {
    if (!routeEngine?.quote) throw new Error('route_engine_required');
    this.routeEngine = routeEngine;
    this.receiptSink = receiptSink;
    this.storage = storage;
    this.storageKey = storageKey;
    this.now = now;
    this.deployments = new Map();
    this.receipts = [];
    this.restore();
  }

  restore() {
    if (!this.storage?.getItem) return;
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return;
      const snapshot = JSON.parse(raw);
      if (snapshot?.version !== AGENT_RUNTIME_VERSION) return;
      for (const deployment of snapshot.deployments || []) {
        if (deployment?.deploymentId) this.deployments.set(deployment.deploymentId, deployment);
      }
      this.receipts = Array.isArray(snapshot.receipts) ? snapshot.receipts.slice(-1000) : [];
    } catch (error) {
      console.warn('PARALLAX agent runtime restore failed', error);
    }
  }

  persist() {
    if (!this.storage?.setItem) return;
    const snapshot = {
      version: AGENT_RUNTIME_VERSION,
      savedAt: this.now(),
      deployments: [...this.deployments.values()],
      receipts: this.receipts.slice(-1000)
    };
    this.storage.setItem(this.storageKey, JSON.stringify(snapshot));
  }

  deploy(spec) {
    const errors = this.validateSpec(spec);
    if (errors.length) return { ok: false, errors };

    const deployment = {
      deploymentId: spec.deploymentId || randomId(),
      templateId: spec.templateId,
      name: spec.name || spec.templateId,
      owner: spec.owner,
      mode: spec.mode,
      allowedChains: [...spec.allowedChains],
      allowedAssets: [...spec.allowedAssets],
      maxOrderValueUsd: Number(spec.maxOrderValueUsd),
      dailyLimitUsd: Number(spec.dailyLimitUsd),
      humanApprovalAboveUsd: Number(spec.humanApprovalAboveUsd),
      status: 'paused',
      createdAt: this.now(),
      updatedAt: this.now(),
      spentTodayUsd: 0,
      haltReason: null
    };
    this.deployments.set(deployment.deploymentId, deployment);
    const receipt = this.receipt('agent_deployed', deployment);
    this.persist();
    return { ok: true, deployment: this.publicDeployment(deployment), receipt };
  }

  validateSpec(spec) {
    const errors = [];
    if (!spec?.templateId) errors.push('template_id_required');
    if (!spec?.owner) errors.push('owner_required');
    if (!['paper', 'testnet'].includes(spec?.mode)) errors.push('live_agent_mode_blocked');
    if (!Array.isArray(spec?.allowedChains) || !spec.allowedChains.length) errors.push('allowed_chains_required');
    if (!Array.isArray(spec?.allowedAssets) || !spec.allowedAssets.length) errors.push('allowed_assets_required');
    for (const key of ['maxOrderValueUsd', 'dailyLimitUsd', 'humanApprovalAboveUsd']) {
      if (!Number.isFinite(Number(spec?.[key])) || Number(spec[key]) <= 0) errors.push(`${key}_invalid`);
    }
    if (Number(spec?.humanApprovalAboveUsd) > Number(spec?.maxOrderValueUsd)) errors.push('approval_threshold_above_order_limit');
    if (Number(spec?.maxOrderValueUsd) > Number(spec?.dailyLimitUsd)) errors.push('order_limit_above_daily_limit');
    return errors;
  }

  listDeployments() {
    return [...this.deployments.values()]
      .map((deployment) => this.publicDeployment(deployment))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getDeployment(deploymentId) {
    const deployment = this.deployments.get(deploymentId);
    return deployment ? this.publicDeployment(deployment) : null;
  }

  listReceipts(limit = 100) {
    const capped = Math.max(1, Math.min(Number(limit) || 100, 1000));
    return this.receipts.slice(-capped).reverse();
  }

  setStatus(deploymentId, status, reason = null) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return { ok: false, errors: ['deployment_not_found'] };
    if (!['active', 'paused', 'halted'].includes(status)) return { ok: false, errors: ['invalid_status'] };
    if (deployment.status === 'halted' && status === 'active') return { ok: false, errors: ['halted_agent_requires_pause_before_activation'] };
    deployment.status = status;
    deployment.haltReason = status === 'halted' ? reason || 'operator_halt' : null;
    deployment.updatedAt = this.now();
    const receipt = this.receipt(`agent_${status}`, deployment);
    this.persist();
    return { ok: true, deployment: this.publicDeployment(deployment), receipt };
  }

  async evaluateOrder(deploymentId, order, approval = null) {
    const deployment = this.deployments.get(deploymentId);
    const errors = [];
    if (!deployment) return { ok: false, errors: ['deployment_not_found'] };
    if (deployment.status !== 'active') errors.push(`agent_${deployment.status}`);
    if (!deployment.allowedChains.includes(String(order.chainId))) errors.push('chain_not_allowed');
    if (!deployment.allowedAssets.includes(String(order.sellAsset).toUpperCase()) || !deployment.allowedAssets.includes(String(order.buyAsset).toUpperCase())) errors.push('asset_not_allowed');
    const valueUsd = Number(order.valueUsd);
    if (!Number.isFinite(valueUsd) || valueUsd <= 0) errors.push('order_value_invalid');
    if (valueUsd > deployment.maxOrderValueUsd) errors.push('max_order_value_exceeded');
    if (deployment.spentTodayUsd + valueUsd > deployment.dailyLimitUsd) errors.push('daily_limit_exceeded');
    if (valueUsd >= deployment.humanApprovalAboveUsd && approval?.approvedBy === deployment.owner) errors.push('agent_self_approval_blocked');
    if (valueUsd >= deployment.humanApprovalAboveUsd && !approval?.approvedBy) errors.push('human_approval_required');
    if (valueUsd >= deployment.humanApprovalAboveUsd && !approval?.approvalId) errors.push('approval_receipt_required');
    if (order.mode !== deployment.mode) errors.push('mode_mismatch');
    if (errors.length) return { ok: false, errors, receipt: this.receipt('agent_order_rejected', { deploymentId, order, errors }) };

    const quote = await this.routeEngine.quote(order);
    if (!quote.ok) return { ok: false, errors: quote.errors || ['route_unavailable'], receipt: quote.receipt || null };
    deployment.spentTodayUsd += valueUsd;
    deployment.updatedAt = this.now();
    const receipt = this.receipt('agent_order_approved', { deploymentId, order, quoteReceiptId: quote.receipt.receiptId });
    this.persist();
    return {
      ok: true,
      status: 'policy_approved_simulation',
      quote,
      deployment: this.publicDeployment(deployment),
      receipt
    };
  }

  publicDeployment(deployment) {
    return { ...deployment, allowedChains: [...deployment.allowedChains], allowedAssets: [...deployment.allowedAssets] };
  }

  receipt(kind, payload) {
    const receipt = {
      receiptId: `${kind}:${randomId()}`,
      kind,
      runtimeVersion: AGENT_RUNTIME_VERSION,
      createdAt: this.now(),
      payload,
      mainnetExecution: false
    };
    this.receipts.push(receipt);
    if (this.receipts.length > 1000) this.receipts.shift();
    if (this.receiptSink) this.receiptSink(receipt);
    return receipt;
  }
}

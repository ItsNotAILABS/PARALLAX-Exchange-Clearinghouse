import crypto from 'node:crypto';

const POLICY = {
  schema: 'parallax.crypto_user_funding.runtime.v1',
  posture: 'user_funded_purchase_rails_gated',
  custodyDefault: false,
  livePurchaseAutoExecution: false,
  privateKeysAccepted: false,
  seedPhrasesAccepted: false,
  operatorApprovalRequiredAboveUsd: 2500,
  kycAmlReviewRequiredAboveUsd: 1000,
  receiptRequired: true
};

const SUPPORTED_CHAINS = new Set(['icp', 'bitcoin', 'ethereum', 'base', 'polygon', 'solana', 'testnet']);
const SUPPORTED_ASSETS = new Set(['stablecoin', 'native_crypto', 'testnet_token', 'internal_credit']);
const REQUIRED_CONSENT = [
  'asset_and_chain_selected',
  'network_fee_disclosed',
  'refund_policy_disclosed',
  'purchase_terms_accepted',
  'risk_and_volatility_notice_acknowledged',
  'no_deposit_account_acknowledged'
];

function hashReceipt(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function now() {
  return new Date().toISOString();
}

function assertString(value, name) {
  if (typeof value !== 'string' || value.trim().length < 2) throw new Error(`${name}_required`);
  return value.trim();
}

function normalizeMoney(value, name = 'amountUsd') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name}_must_be_positive`);
  return Math.round(n * 100) / 100;
}

function missingConsent(consent = []) {
  const set = new Set(consent);
  return REQUIRED_CONSENT.filter((item) => !set.has(item));
}

function baseReceipt(kind, body) {
  const receipt = {
    schema: 'parallax.crypto_receipt.v1',
    kind,
    createdAt: now(),
    posture: POLICY.posture,
    body
  };
  return { ...receipt, receiptHash: `sha256:${hashReceipt(receipt)}` };
}

export function createFundingIntent(input = {}) {
  const userId = assertString(input.userId, 'userId');
  const vaultId = assertString(input.vaultId, 'vaultId');
  const purchaseId = assertString(input.purchaseId, 'purchaseId');
  const chain = assertString(input.chain, 'chain').toLowerCase();
  const assetClass = assertString(input.assetClass, 'assetClass').toLowerCase();
  const amountUsd = normalizeMoney(input.amountUsd);
  const mode = assertString(input.mode ?? 'external_checkout_provider', 'mode');

  if (!SUPPORTED_CHAINS.has(chain)) throw new Error('unsupported_chain');
  if (!SUPPORTED_ASSETS.has(assetClass)) throw new Error('unsupported_asset_class');

  const missing = missingConsent(input.userConsent);
  if (missing.length) {
    return baseReceipt('crypto_funding_intent_rejected', {
      userId,
      vaultId,
      purchaseId,
      decision: 'rejected',
      reason: 'missing_user_consent',
      missingConsent: missing
    });
  }

  const intentId = `cfi_${hashReceipt({ userId, vaultId, purchaseId, chain, assetClass, amountUsd, mode, t: now() }).slice(0, 20)}`;
  const requiresKycAmlReview = amountUsd >= POLICY.kycAmlReviewRequiredAboveUsd;
  const requiresOperatorApproval = amountUsd >= POLICY.operatorApprovalRequiredAboveUsd;

  return baseReceipt('crypto_funding_intent', {
    intentId,
    userId,
    vaultId,
    purchaseId,
    chain,
    assetClass,
    amountUsd,
    mode,
    status: 'funding_pending',
    custody: false,
    providerSessionRef: input.providerSessionRef ?? null,
    receivingAddressRef: input.receivingAddressRef ?? null,
    requiresKycAmlReview,
    requiresOperatorApproval,
    next: [
      'create_or_fetch_provider_session',
      'observe_transaction_or_provider_webhook',
      'confirm_funding_before_credit',
      'evaluate_purchase_authorization'
    ]
  });
}

export function recordFundingConfirmation(input = {}) {
  const intentId = assertString(input.intentId, 'intentId');
  const txOrProviderRef = assertString(input.txOrProviderRef, 'txOrProviderRef');
  const confirmedAmountUsd = normalizeMoney(input.confirmedAmountUsd, 'confirmedAmountUsd');
  const confirmations = Number(input.confirmations ?? 0);
  const chain = assertString(input.chain, 'chain').toLowerCase();

  if (!SUPPORTED_CHAINS.has(chain)) throw new Error('unsupported_chain');
  if (!Number.isFinite(confirmations) || confirmations < 0) throw new Error('confirmations_invalid');

  const status = confirmations > 0 || input.providerStatus === 'confirmed' ? 'funding_confirmed' : 'funding_observed';

  return baseReceipt('funding_confirmation', {
    intentId,
    chain,
    txOrProviderRef,
    confirmedAmountUsd,
    confirmations,
    providerStatus: input.providerStatus ?? null,
    status,
    balanceCreditProposed: status === 'funding_confirmed',
    custody: false
  });
}

export function evaluatePurchaseAuthorization(input = {}) {
  const purchaseId = assertString(input.purchaseId, 'purchaseId');
  const vaultId = assertString(input.vaultId, 'vaultId');
  const userId = assertString(input.userId, 'userId');
  const amountUsd = normalizeMoney(input.amountUsd);
  const availableFundingUsd = normalizeMoney(input.availableFundingUsd, 'availableFundingUsd');
  const requestedMode = assertString(input.requestedMode ?? 'paper_or_testnet_purchase', 'requestedMode');

  const reasons = [];
  if (availableFundingUsd < amountUsd) reasons.push('insufficient_confirmed_user_funding');
  if (requestedMode.includes('live') && !input.liveGateApproved) reasons.push('live_gate_not_approved');
  if (amountUsd >= POLICY.kycAmlReviewRequiredAboveUsd && !input.kycAmlCleared) reasons.push('kyc_aml_review_required');
  if (amountUsd >= POLICY.operatorApprovalRequiredAboveUsd && !input.operatorApproved) reasons.push('operator_approval_required');

  const decision = reasons.length ? 'requires_review_or_rejected' : 'approved_for_gated_purchase';

  return baseReceipt('purchase_authorization', {
    purchaseId,
    vaultId,
    userId,
    amountUsd,
    availableFundingUsd,
    requestedMode,
    decision,
    reasons,
    autoExecutionAllowed: false,
    custody: false,
    next: decision === 'approved_for_gated_purchase' ? ['emit_purchase_receipt', 'append_proof_room'] : ['collect_required_evidence']
  });
}

export function getCryptoFundingPolicy() {
  return { ...POLICY, supportedChains: [...SUPPORTED_CHAINS], supportedAssetClasses: [...SUPPORTED_ASSETS], requiredConsent: REQUIRED_CONSENT };
}

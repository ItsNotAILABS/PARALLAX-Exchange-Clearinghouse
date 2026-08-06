type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type GatewayResponse = {
  ok: boolean;
  requestId: string;
  service: string;
  mode: string;
  posture: string;
  data?: JsonValue;
  error?: {
    code: string;
    message: string;
  };
};

type FundingIntentInput = {
  userId?: string;
  vaultId?: string;
  purchaseId?: string;
  chain?: string;
  assetClass?: string;
  amountUsd?: number;
  mode?: string;
  providerSessionRef?: string;
  receivingAddressRef?: string;
  userConsent?: string[];
};

type FundingConfirmationInput = {
  intentId?: string;
  txOrProviderRef?: string;
  confirmedAmountUsd?: number;
  confirmations?: number;
  chain?: string;
  providerStatus?: string;
};

type PurchaseAuthorizationInput = {
  purchaseId?: string;
  vaultId?: string;
  userId?: string;
  amountUsd?: number;
  availableFundingUsd?: number;
  requestedMode?: string;
  liveGateApproved?: boolean;
  kycAmlCleared?: boolean;
  operatorApprovalId?: string;
};

const SERVICE = 'parallax-edge-gateway';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const LEDGERS = [
  { id: 'parallax-paper-ledger', mode: 'paper', assets: ['PXUSD', 'PXICP', 'PXAI', 'PXGPU', 'PXETH', 'PXCRED'], liveValue: false },
  { id: 'icp-local-ledger', mode: 'testnet', assets: ['PXICP', 'PXAI', 'PXCRED'], liveValue: false },
  { id: 'ethereum-testnet-ledger', mode: 'testnet', assets: ['PXETH', 'PXUSD', 'PXGPU'], liveValue: false },
  { id: 'agent-credit-ledger', mode: 'paper', assets: ['PXCRED', 'PXAI', 'PXGPU'], liveValue: false },
];

const TOKENS = [
  { symbol: 'PXUSD', class: 'paper_stable_unit', mode: 'paper', valueClaim: 'no_real_value' },
  { symbol: 'PXICP', class: 'testnet_protocol_unit', mode: 'testnet', valueClaim: 'testnet_only' },
  { symbol: 'PXETH', class: 'evm_test_unit', mode: 'testnet', valueClaim: 'testnet_only' },
  { symbol: 'PXAI', class: 'agent_work_credit', mode: 'paper', valueClaim: 'internal_credit_only' },
  { symbol: 'PXGPU', class: 'compute_credit', mode: 'paper', valueClaim: 'internal_compute_accounting_only' },
  { symbol: 'PXCRED', class: 'receipt_credit', mode: 'paper', valueClaim: 'internal_credit_only' },
];

const AGENT_CLASSES = [
  { id: 'agent-operator-wallet', allowedLedgers: ['parallax-paper-ledger', 'icp-local-ledger'], requiresHumanApproval: true },
  { id: 'agent-research-wallet', allowedLedgers: ['agent-credit-ledger', 'parallax-paper-ledger'], requiresHumanApproval: false, humanApprovalAbove: 500 },
  { id: 'agent-strategy-wallet', allowedLedgers: ['parallax-paper-ledger', 'ethereum-testnet-ledger'], requiresHumanApproval: true },
];

const ALPHA_GATES = [
  'no_live_money_movement',
  'no_live_broker_routing',
  'no_mainnet_bridge_in_alpha',
  'all_agent_commands_policy_evaluated',
  'all_state_transitions_emit_receipts',
  'edge_gateway_auth_required_for_mutation',
  'crypto_funding_intents_require_user_consent',
  'purchase_authorization_requires_confirmed_user_funding',
  'tunnel_origin_locked_down',
  'public_claims_match_evidence',
];

const FUNDING_POLICY = {
  schema: 'parallax.crypto_user_funding.edge_policy.v1',
  posture: 'user_funded_purchase_rails_gated',
  custodyDefault: false,
  livePurchaseAutoExecution: false,
  privateKeysAccepted: false,
  seedPhrasesAccepted: false,
  rawProviderSecretsAccepted: false,
  operatorApprovalRequiredAboveUsd: 2500,
  kycAmlReviewRequiredAboveUsd: 1000,
  supportedChains: ['icp', 'bitcoin', 'ethereum', 'base', 'polygon', 'solana', 'testnet'],
  supportedAssetClasses: ['stablecoin', 'native_crypto', 'testnet_token', 'internal_credit'],
  providerModes: ['external_checkout_provider', 'wallet_transfer_reference', 'manual_operator_confirmation', 'testnet_faucet'],
  requiredConsent: [
    'asset_and_chain_selected',
    'network_fee_disclosed',
    'refund_policy_disclosed',
    'purchase_terms_accepted',
    'risk_and_volatility_notice_acknowledged',
    'no_deposit_account_acknowledged',
  ],
  denied: [
    'custody_claim',
    'private_key_capture',
    'seed_phrase_capture',
    'autonomous_live_purchase',
    'token_sale_claim',
    'yield_claim',
    'exchange_or_bank_claim',
  ],
};

const requestId = () => crypto.randomUUID();

const hashValue = async (value: JsonValue) => {
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const receipt = async (kind: string, body: JsonValue) => {
  const base = {
    schema: 'parallax.edge_receipt.v1',
    kind,
    createdAt: new Date().toISOString(),
    posture: FUNDING_POLICY.posture,
    body,
  } satisfies JsonValue;
  return { ...base, receiptHash: `sha256:${await hashValue(base)}` } satisfies JsonValue;
};

const allowedOrigins = (env: Env) => env.PARALLAX_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);

const corsHeaders = (request: Request, env: Env) => {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = allowedOrigins(env);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] ?? '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Parallax-Mode,X-Parallax-Agent,X-Parallax-User',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

const json = (request: Request, env: Env, status: number, body: GatewayResponse) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Parallax-Mode': env.PARALLAX_ENV,
      ...corsHeaders(request, env),
    },
  });

const ok = (request: Request, env: Env, id: string, data: JsonValue, status = 200) =>
  json(request, env, status, { ok: true, requestId: id, service: SERVICE, mode: env.PARALLAX_ENV, posture: env.PARALLAX_PUBLIC_POSTURE, data });

const fail = (request: Request, env: Env, id: string, status: number, code: string, message: string) =>
  json(request, env, status, { ok: false, requestId: id, service: SERVICE, mode: env.PARALLAX_ENV, posture: env.PARALLAX_PUBLIC_POSTURE, error: { code, message } });

const isAuthorized = (request: Request, env: Env) => {
  if (env.PARALLAX_REQUIRE_AUTH_FOR_MUTATION !== 'true') return true;
  const token = env.PARALLAX_EDGE_TOKEN;
  if (!token) return false;
  const authorization = request.headers.get('Authorization') ?? '';
  return authorization === `Bearer ${token}`;
};

const assertMutationAuth = (request: Request, env: Env, id: string) => {
  if (!MUTATION_METHODS.has(request.method)) return null;
  if (isAuthorized(request, env)) return null;
  return fail(request, env, id, 401, 'EDGE_AUTH_REQUIRED', 'Mutation routes require PARALLAX_EDGE_TOKEN bearer authentication.');
};

const readJson = async <T>(request: Request): Promise<T | null> => {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) return null;
  return request.json<T>();
};

const stringValue = (value: unknown, name: string) => {
  if (typeof value !== 'string' || value.trim().length < 2) throw new Error(`${name}_required`);
  return value.trim();
};

const amountValue = (value: unknown, name: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`${name}_must_be_positive`);
  return Math.round(amount * 100) / 100;
};

const missingConsent = (consent: string[] = []) => FUNDING_POLICY.requiredConsent.filter((item) => !new Set(consent).has(item));

const createFundingIntent = async (input: FundingIntentInput) => {
  const userId = stringValue(input.userId, 'userId');
  const vaultId = stringValue(input.vaultId, 'vaultId');
  const purchaseId = stringValue(input.purchaseId, 'purchaseId');
  const chain = stringValue(input.chain, 'chain').toLowerCase();
  const assetClass = stringValue(input.assetClass, 'assetClass').toLowerCase();
  const amountUsd = amountValue(input.amountUsd, 'amountUsd');
  const mode = stringValue(input.mode ?? 'external_checkout_provider', 'mode');

  if (!FUNDING_POLICY.supportedChains.includes(chain)) throw new Error('unsupported_chain');
  if (!FUNDING_POLICY.supportedAssetClasses.includes(assetClass)) throw new Error('unsupported_asset_class');
  if (!FUNDING_POLICY.providerModes.includes(mode)) throw new Error('unsupported_provider_mode');

  const missing = missingConsent(input.userConsent ?? []);
  if (missing.length > 0) {
    return receipt('crypto_funding_intent_rejected', { decision: 'rejected', reason: 'missing_user_consent', missingConsent: missing, userId, vaultId, purchaseId });
  }

  const intentHash = await hashValue({ userId, vaultId, purchaseId, chain, assetClass, amountUsd, mode, t: Date.now() });
  const intentId = `cfi_${intentHash.slice(0, 20)}`;
  return receipt('crypto_funding_intent', {
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
    requiresKycAmlReview: amountUsd >= FUNDING_POLICY.kycAmlReviewRequiredAboveUsd,
    requiresOperatorApproval: amountUsd >= FUNDING_POLICY.operatorApprovalRequiredAboveUsd,
    next: ['provider_session_or_wallet_transfer', 'funding_confirmation', 'purchase_authorization', 'receipt_append'],
  });
};

const recordFundingConfirmation = async (input: FundingConfirmationInput) => {
  const intentId = stringValue(input.intentId, 'intentId');
  const txOrProviderRef = stringValue(input.txOrProviderRef, 'txOrProviderRef');
  const confirmedAmountUsd = amountValue(input.confirmedAmountUsd, 'confirmedAmountUsd');
  const confirmations = Number(input.confirmations ?? 0);
  const chain = stringValue(input.chain, 'chain').toLowerCase();
  if (!FUNDING_POLICY.supportedChains.includes(chain)) throw new Error('unsupported_chain');
  if (!Number.isFinite(confirmations) || confirmations < 0) throw new Error('confirmations_invalid');
  const status = confirmations > 0 || input.providerStatus === 'confirmed' ? 'funding_confirmed' : 'funding_observed';
  return receipt('crypto_funding_confirmation', {
    intentId,
    chain,
    txOrProviderRef,
    confirmedAmountUsd,
    confirmations,
    providerStatus: input.providerStatus ?? null,
    status,
    balanceCreditProposed: status === 'funding_confirmed',
    custody: false,
  });
};

const authorizePurchase = async (input: PurchaseAuthorizationInput) => {
  const purchaseId = stringValue(input.purchaseId, 'purchaseId');
  const vaultId = stringValue(input.vaultId, 'vaultId');
  const userId = stringValue(input.userId, 'userId');
  const amountUsd = amountValue(input.amountUsd, 'amountUsd');
  const availableFundingUsd = amountValue(input.availableFundingUsd, 'availableFundingUsd');
  const requestedMode = stringValue(input.requestedMode ?? 'paper_or_testnet_purchase', 'requestedMode');
  const reasons: string[] = [];

  if (availableFundingUsd < amountUsd) reasons.push('insufficient_confirmed_user_funding');
  if (requestedMode.includes('live') && !input.liveGateApproved) reasons.push('regulated_live_gate_required');
  if (amountUsd >= FUNDING_POLICY.kycAmlReviewRequiredAboveUsd && !input.kycAmlCleared) reasons.push('kyc_aml_review_required');
  if (amountUsd >= FUNDING_POLICY.operatorApprovalRequiredAboveUsd && !input.operatorApprovalId) reasons.push('operator_approval_required');

  const decision = reasons.length === 0 ? 'authorized' : 'blocked';
  return receipt('crypto_purchase_authorization', {
    purchaseId,
    vaultId,
    userId,
    amountUsd,
    availableFundingUsd,
    requestedMode,
    decision,
    reasonCodes: reasons.length === 0 ? ['confirmed_user_funding_available'] : reasons,
    execution: requestedMode.includes('live') ? 'manual_live_gate_required' : 'paper_or_testnet_only',
    custody: false,
  });
};

const evaluateAgentCommand = async (request: Request, env: Env, id: string) => {
  const authFailure = assertMutationAuth(request, env, id);
  if (authFailure) return authFailure;

  const input = await readJson<{ agentClass?: string; ledgerId?: string; asset?: string; amount?: number; mode?: string; humanApprovalId?: string }>(request);
  if (!input) return fail(request, env, id, 400, 'INVALID_JSON', 'Expected application/json request body.');

  const reasons: string[] = [];
  const mode = input.mode ?? 'paper';
  const ledger = LEDGERS.find((item) => item.id === input.ledgerId);
  const agentClass = AGENT_CLASSES.find((item) => item.id === input.agentClass);
  if (!agentClass) reasons.push('AGENT_CLASS_NOT_FOUND');
  if (!ledger) reasons.push('LEDGER_NOT_FOUND');
  if (mode === 'live' || mode === 'restricted_live') reasons.push('LIVE_MODE_BLOCKED');
  if (ledger?.liveValue) reasons.push('LIVE_VALUE_BLOCKED');
  if (ledger && input.asset && !ledger.assets.includes(input.asset)) reasons.push('ASSET_NOT_ALLOWED_FOR_LEDGER');
  if (agentClass && ledger && !agentClass.allowedLedgers.includes(ledger.id)) reasons.push('LEDGER_NOT_ALLOWED_FOR_AGENT');
  if (!input.amount || input.amount <= 0) reasons.push('INVALID_AMOUNT');
  if (agentClass?.requiresHumanApproval && !input.humanApprovalId) reasons.push('HUMAN_APPROVAL_REQUIRED');
  if ((agentClass?.humanApprovalAbove ?? Number.POSITIVE_INFINITY) <= (input.amount ?? 0) && !input.humanApprovalId) reasons.push('HUMAN_APPROVAL_REQUIRED');

  const uniqueReasons = [...new Set(reasons)];
  const decision = uniqueReasons.length === 0 ? 'approved' : uniqueReasons.includes('HUMAN_APPROVAL_REQUIRED') && uniqueReasons.length === 1 ? 'requires_human_approval' : 'rejected';
  return ok(request, env, id, { decision, reasonCodes: uniqueReasons.length === 0 ? ['VALID'] : uniqueReasons, input, alphaBoundary: { noLiveMoneyMovement: true, noLiveBrokerRouting: true, noMainnetBridgeInAlpha: true } });
};

const handleCryptoFunding = async (request: Request, env: Env, id: string, pathname: string) => {
  if (pathname === '/v1/crypto/funding/policy' && request.method === 'GET') return ok(request, env, id, FUNDING_POLICY as JsonValue);

  const authFailure = assertMutationAuth(request, env, id);
  if (authFailure) return authFailure;

  try {
    if (pathname === '/v1/crypto/funding/intents' && request.method === 'POST') {
      const input = await readJson<FundingIntentInput>(request);
      if (!input) return fail(request, env, id, 400, 'INVALID_JSON', 'Expected application/json request body.');
      return ok(request, env, id, await createFundingIntent(input), 201);
    }
    if (pathname === '/v1/crypto/funding/confirmations' && request.method === 'POST') {
      const input = await readJson<FundingConfirmationInput>(request);
      if (!input) return fail(request, env, id, 400, 'INVALID_JSON', 'Expected application/json request body.');
      return ok(request, env, id, await recordFundingConfirmation(input), 201);
    }
    if (pathname === '/v1/crypto/purchases/authorize' && request.method === 'POST') {
      const input = await readJson<PurchaseAuthorizationInput>(request);
      if (!input) return fail(request, env, id, 400, 'INVALID_JSON', 'Expected application/json request body.');
      return ok(request, env, id, await authorizePurchase(input), 200);
    }
  } catch (error) {
    return fail(request, env, id, 400, 'CRYPTO_FUNDING_POLICY_REJECTED', error instanceof Error ? error.message : 'Invalid crypto funding request.');
  }

  return fail(request, env, id, 404, 'NOT_FOUND', `No PARALLAX crypto funding route for ${pathname}.`);
};

const proxyToCore = async (request: Request, env: Env, id: string, pathname: string) => {
  const authFailure = assertMutationAuth(request, env, id);
  if (authFailure) return authFailure;
  const target = new URL(pathname.replace(/^\/v1\/proxy/, ''), env.PARALLAX_CORE_URL);
  target.search = new URL(request.url).search;
  const proxied = new Request(target.toString(), { method: request.method, headers: request.headers, body: MUTATION_METHODS.has(request.method) ? request.body : undefined });
  const response = await fetch(proxied);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) headers.set(key, value);
  headers.set('X-Parallax-Request-Id', id);
  headers.set('X-Parallax-Proxy-Origin', env.PARALLAX_CORE_URL);
  return new Response(response.body, { status: response.status, headers });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = requestId();
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (url.pathname === '/' || url.pathname === '/health') {
      return ok(request, env, id, { status: 'ok', ledgers: LEDGERS.length, tokens: TOKENS.length, agentClasses: AGENT_CLASSES.length, cryptoFunding: true, alphaGates: ALPHA_GATES, tunnelExpectedHost: env.PARALLAX_TUNNEL_EXPECTED_HOST });
    }

    if (url.pathname === '/v1/ledgers') return ok(request, env, id, { ledgers: LEDGERS });
    if (url.pathname === '/v1/tokens') return ok(request, env, id, { tokens: TOKENS });
    if (url.pathname === '/v1/agents/classes') return ok(request, env, id, { agentClasses: AGENT_CLASSES });
    if (url.pathname === '/v1/alpha/gates') return ok(request, env, id, { alphaGates: ALPHA_GATES });
    if (url.pathname === '/v1/agent-command/evaluate' && request.method === 'POST') return evaluateAgentCommand(request, env, id);
    if (url.pathname.startsWith('/v1/crypto/')) return handleCryptoFunding(request, env, id, url.pathname);
    if (url.pathname.startsWith('/v1/proxy/')) return proxyToCore(request, env, id, url.pathname);
    return fail(request, env, id, 404, 'NOT_FOUND', `No PARALLAX edge route for ${url.pathname}.`);
  },
};

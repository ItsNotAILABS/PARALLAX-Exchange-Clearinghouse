import crypto from 'node:crypto';
import { createWallet, quoteFx, acceptFxQuote, POLICY as PAPER_POLICY } from './index.js';

export const PRODUCT_POLICY = {
  schema: 'parallax.us_mx_wallet_product.policy.v2',
  posture: 'provider_backed_non_custodial_card_network_execution',
  corridor: 'US_MX',
  currencies: ['USD', 'MXN'],
  paymentModel: 'debit_card_authorization_and_push_to_card_provider_execution',
  executionThesis: 'PARALLAX orchestrates consent, quote intent, provider instructions, compliance gates, and blockchain-grade receipts; a licensed provider/card-network rail executes money movement so PARALLAX does not hold customer funds.',
  requiredProviderCapabilities: [
    'customer_identity_verification',
    'tokenized_debit_card_authorization',
    'cardholder_authentication_3ds_or_equivalent',
    'card_network_push_to_card_or_original_credit_transaction',
    'usd_funding_source',
    'mxn_payout_destination',
    'fx_quote_lock',
    'provider_side_funds_flow',
    'webhook_or_reconciliation_event',
    'refund_or_reversal_path',
    'ledger_export'
  ],
  requiredSecrets: [
    'USMX_PROVIDER_API_KEY',
    'USMX_PROVIDER_WEBHOOK_SECRET',
    'USMX_LEDGER_SIGNING_SECRET'
  ],
  providerAlias: 'MESSI_OR_CARD_RAIL_PROVIDER_ADAPTER',
  blockedWithoutProvider: [
    'live_debit_card_authorization',
    'live_card_network_push_to_card',
    'live_fx_execution',
    'live_mxn_payout',
    'regulated_remittance_claim'
  ],
  boundaries: {
    custodyByParallax: false,
    customerFundsHeldByParallax: false,
    settlementByProviderOnly: true,
    privateKeyCapture: false,
    seedPhraseCapture: false,
    rawBankCredentialStorage: false,
    rawCardNumberStorage: false,
    cvvStorage: false,
    autonomousLiveSettlement: false,
    bankClaim: false,
    moneyTransmitterClaimWithoutLicenseOrPartner: false
  },
  blockchainReceiptSurfaces: [
    'motoko_icp_audit_canister',
    'solidity_evm_receipt_registry',
    'hash_chained_provider_receipts'
  ]
};

const now = () => new Date().toISOString();
const stable = (value) => {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stable);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
};
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const id = (prefix, body) => `${prefix}_${hash({ body, time: now(), random: crypto.randomUUID() }).slice(0, 24)}`;
const money = (value, name = 'amount') => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name}_invalid`);
  return Number(parsed.toFixed(2));
};
const positiveMoney = (value, name = 'amount') => {
  const parsed = money(value, name);
  if (parsed <= 0) throw new Error(`${name}_must_be_positive`);
  return parsed;
};
const stringRequired = (value, name) => {
  if (typeof value !== 'string' || value.trim().length < 2) throw new Error(`${name}_required`);
  return value.trim();
};
const upper = (value, name) => stringRequired(value, name).toUpperCase();
const receipt = (kind, body) => {
  const base = {
    schema: 'parallax.us_mx_wallet_product.receipt.v2',
    kind,
    createdAt: now(),
    posture: PRODUCT_POLICY.posture,
    custodyByParallax: false,
    body: stable(body)
  };
  return { ...base, receiptHash: `sha256:${hash(base)}` };
};

export class MemoryLedgerStore {
  constructor() {
    this.wallets = new Map();
    this.quotes = new Map();
    this.cardPaymentIntents = new Map();
    this.cardExecutions = new Map();
    this.events = [];
  }

  saveWallet(wallet) {
    this.wallets.set(wallet.walletId, structuredClone(wallet));
    return structuredClone(wallet);
  }

  getWallet(walletId) {
    const wallet = this.wallets.get(walletId);
    return wallet ? structuredClone(wallet) : null;
  }

  saveQuote(quote) {
    this.quotes.set(quote.quoteId, structuredClone(quote));
    return structuredClone(quote);
  }

  getQuote(quoteId) {
    const quote = this.quotes.get(quoteId);
    return quote ? structuredClone(quote) : null;
  }

  saveCardPaymentIntent(intent) {
    this.cardPaymentIntents.set(intent.intentId, structuredClone(intent));
    return structuredClone(intent);
  }

  getCardPaymentIntent(intentId) {
    const intent = this.cardPaymentIntents.get(intentId);
    return intent ? structuredClone(intent) : null;
  }

  saveCardExecution(execution) {
    this.cardExecutions.set(execution.executionId, structuredClone(execution));
    return structuredClone(execution);
  }

  appendEvent(event) {
    const last = this.events.at(-1);
    const enriched = {
      ...event,
      sequence: this.events.length + 1,
      previousHash: last?.eventHash || null
    };
    const eventHash = `sha256:${hash(enriched)}`;
    const sealed = { ...enriched, eventHash };
    this.events.push(sealed);
    return structuredClone(sealed);
  }

  snapshot() {
    return {
      schema: 'parallax.us_mx_wallet_product.snapshot.v2',
      custodyByParallax: false,
      wallets: [...this.wallets.values()],
      quotes: [...this.quotes.values()],
      cardPaymentIntents: [...this.cardPaymentIntents.values()],
      cardExecutions: [...this.cardExecutions.values()],
      events: this.events,
      eventHead: this.events.at(-1)?.eventHash || null
    };
  }
}

export class ProviderAdapter {
  constructor({ mode = 'sandbox', provider = 'manual_provider_contract', capabilities = [] } = {}) {
    this.mode = mode;
    this.provider = provider;
    this.capabilities = new Set(capabilities);
  }

  assertReady({ live = false, required = PRODUCT_POLICY.requiredProviderCapabilities } = {}) {
    const missing = required.filter((capability) => !this.capabilities.has(capability));
    if (live && missing.length) {
      const error = new Error('provider_capabilities_missing');
      error.details = { missing };
      throw error;
    }
    return { provider: this.provider, mode: this.mode, missingCapabilities: missing, liveReady: missing.length === 0 };
  }

  createFundingSession({ walletId, customerId, amountUsd }) {
    stringRequired(walletId, 'walletId');
    stringRequired(customerId, 'customerId');
    const amount = positiveMoney(amountUsd, 'amountUsd');
    return receipt('provider_funding_session_created', {
      provider: this.provider,
      mode: this.mode,
      walletId,
      customerId,
      amountUsd: amount,
      providerSessionRef: id('pfs', { walletId, customerId, amount }),
      status: 'created'
    });
  }

  lockFxQuote({ quoteId, fromCurrency, toCurrency, fromAmount, toAmount, rate }) {
    return receipt('provider_fx_quote_locked', {
      provider: this.provider,
      mode: this.mode,
      quoteId: stringRequired(quoteId, 'quoteId'),
      fromCurrency: upper(fromCurrency, 'fromCurrency'),
      toCurrency: upper(toCurrency, 'toCurrency'),
      fromAmount: positiveMoney(fromAmount, 'fromAmount'),
      toAmount: positiveMoney(toAmount, 'toAmount'),
      rate: Number(rate),
      providerQuoteRef: id('pfq', { quoteId, fromCurrency, toCurrency, fromAmount, toAmount, rate })
    });
  }

  createPayoutInstruction({ walletId, payoutProfileId, currency, amount }) {
    return receipt('provider_payout_instruction_created', {
      provider: this.provider,
      mode: this.mode,
      walletId: stringRequired(walletId, 'walletId'),
      payoutProfileId: stringRequired(payoutProfileId, 'payoutProfileId'),
      currency: upper(currency, 'currency'),
      amount: positiveMoney(amount),
      payoutInstructionRef: id('ppi', { walletId, payoutProfileId, currency, amount }),
      status: this.mode === 'live' ? 'requires_provider_confirmation' : 'sandbox_created'
    });
  }

  createDebitCardAuthorization({ customerId, sourceCardToken, amountUsd, intentId, threeDsRef }) {
    return receipt('provider_debit_card_authorization_created', {
      provider: this.provider,
      mode: this.mode,
      customerId: stringRequired(customerId, 'customerId'),
      sourceCardToken: stringRequired(sourceCardToken, 'sourceCardToken'),
      amountUsd: positiveMoney(amountUsd, 'amountUsd'),
      intentId: stringRequired(intentId, 'intentId'),
      threeDsRef: stringRequired(threeDsRef || 'sandbox_3ds_authenticated', 'threeDsRef'),
      providerAuthorizationRef: id('pca', { customerId, sourceCardToken, amountUsd, intentId, threeDsRef }),
      captureMode: 'provider_captures_or_authenticates_card_not_parallax',
      rawCardDataReceivedByParallax: false,
      status: this.mode === 'live' ? 'requires_provider_confirmation' : 'sandbox_authorized'
    });
  }

  createCardNetworkPush({ customerId, destinationCardToken, currency, amount, intentId }) {
    return receipt('provider_card_network_push_created', {
      provider: this.provider,
      mode: this.mode,
      customerId: stringRequired(customerId, 'customerId'),
      destinationCardToken: stringRequired(destinationCardToken, 'destinationCardToken'),
      currency: upper(currency, 'currency'),
      amount: positiveMoney(amount),
      intentId: stringRequired(intentId, 'intentId'),
      providerPushRef: id('pcp', { customerId, destinationCardToken, currency, amount, intentId }),
      pushType: 'push_to_card_or_original_credit_transaction_provider_rail',
      settlementByParallax: false,
      status: this.mode === 'live' ? 'requires_provider_confirmation' : 'sandbox_push_created'
    });
  }
}

export function createCustomer(input = {}) {
  const customerId = input.customerId || id('cus', input);
  const country = upper(input.country, 'country');
  if (!['US', 'MX'].includes(country)) throw new Error('unsupported_country');
  const ownerId = stringRequired(input.ownerId, 'ownerId');
  const kycStatus = input.kycStatus || 'not_started';
  return receipt('customer_created', {
    customerId,
    ownerId,
    country,
    kycStatus,
    sanctionsScreenStatus: input.sanctionsScreenStatus || 'not_started',
    disclosureVersion: input.disclosureVersion || 'usmx-fx-v2-card-network',
    piiStorage: 'external_or_tokenized_only',
    cardDataStorage: 'provider_token_only_no_raw_pan_no_cvv'
  });
}

export function openProductWallet(input = {}, store = new MemoryLedgerStore()) {
  const walletReceipt = createWallet({
    ownerId: stringRequired(input.ownerId, 'ownerId'),
    country: stringRequired(input.country, 'country'),
    walletId: input.walletId,
    initialUsd: input.initialUsd || 0,
    initialMxn: input.initialMxn || 0
  });
  const wallet = {
    ...walletReceipt.body,
    status: 'open',
    customerId: input.customerId || null,
    ledgerMode: input.ledgerMode || 'sandbox',
    custodyByParallax: false,
    fundsFlow: 'provider_executed_or_paper_only',
    updatedAt: now()
  };
  store.saveWallet(wallet);
  const event = store.appendEvent({ type: 'wallet.opened', walletId: wallet.walletId, receiptHash: walletReceipt.receiptHash });
  return receipt('product_wallet_opened', { wallet, event });
}

export function requestFunding(input = {}, store = new MemoryLedgerStore(), adapter = new ProviderAdapter()) {
  const wallet = store.getWallet(stringRequired(input.walletId, 'walletId'));
  if (!wallet) throw new Error('wallet_not_found');
  const amountUsd = positiveMoney(input.amountUsd, 'amountUsd');
  const customerId = stringRequired(input.customerId || wallet.customerId, 'customerId');
  const providerReadiness = adapter.assertReady({ live: input.mode === 'live', required: ['customer_identity_verification', 'usd_funding_source', 'webhook_or_reconciliation_event'] });
  const providerSession = adapter.createFundingSession({ walletId: wallet.walletId, customerId, amountUsd });
  const event = store.appendEvent({ type: 'funding.session.created', walletId: wallet.walletId, providerReceiptHash: providerSession.receiptHash });
  return receipt('wallet_funding_requested', {
    walletId: wallet.walletId,
    customerId,
    amountUsd,
    providerReadiness,
    providerSession,
    event,
    custodyByParallax: false,
    liveMoneyMovement: input.mode === 'live' ? 'provider_required' : false
  });
}

export function confirmFunding(input = {}, store = new MemoryLedgerStore()) {
  const wallet = store.getWallet(stringRequired(input.walletId, 'walletId'));
  if (!wallet) throw new Error('wallet_not_found');
  const amountUsd = positiveMoney(input.amountUsd, 'amountUsd');
  const providerEventRef = stringRequired(input.providerEventRef, 'providerEventRef');
  wallet.balances.USD = money(wallet.balances.USD + amountUsd, 'USD');
  wallet.updatedAt = now();
  store.saveWallet(wallet);
  const event = store.appendEvent({ type: 'funding.confirmed', walletId: wallet.walletId, amountUsd, providerEventRef });
  return receipt('wallet_funding_confirmed', { wallet, credit: { currency: 'USD', amount: amountUsd }, providerEventRef, event, custodyByParallax: false });
}

export function createFxOrder(input = {}, store = new MemoryLedgerStore(), adapter = new ProviderAdapter()) {
  const wallet = store.getWallet(stringRequired(input.walletId, 'walletId'));
  if (!wallet) throw new Error('wallet_not_found');
  const quote = quoteFx({
    walletId: wallet.walletId,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    amount: input.amount,
    userConsent: input.userConsent || PAPER_POLICY.userConsentRequired,
    usdMxnReference: input.usdMxnReference,
    spreadBps: input.spreadBps,
    flatFee: input.flatFee
  });
  if (quote.kind !== 'fx_quote_created') return quote;
  const quoteBody = { ...quote.body, status: 'quoted', customerId: input.customerId || wallet.customerId || null };
  const providerQuote = adapter.lockFxQuote({
    quoteId: quoteBody.quoteId,
    fromCurrency: quoteBody.fromCurrency,
    toCurrency: quoteBody.toCurrency,
    fromAmount: quoteBody.fromAmount,
    toAmount: quoteBody.toAmount,
    rate: quoteBody.toAmount / quoteBody.fromAmount
  });
  store.saveQuote({ ...quoteBody, providerQuoteRef: providerQuote.body.providerQuoteRef });
  const event = store.appendEvent({ type: 'fx.quote.created', walletId: wallet.walletId, quoteId: quoteBody.quoteId, receiptHash: quote.receiptHash });
  return receipt('product_fx_order_quoted', { quote: quoteBody, providerQuote, event });
}

export function executeFxOrder(input = {}, store = new MemoryLedgerStore(), adapter = new ProviderAdapter()) {
  const wallet = store.getWallet(stringRequired(input.walletId, 'walletId'));
  if (!wallet) throw new Error('wallet_not_found');
  const quote = store.getQuote(stringRequired(input.quoteId, 'quoteId'));
  if (!quote) throw new Error('quote_not_found');
  const acceptance = acceptFxQuote({ walletId: wallet.walletId, balances: wallet.balances, quote, operatorApprovalId: input.operatorApprovalId });
  if (acceptance.kind !== 'fx_exchange_accepted') return acceptance;
  wallet.balances = acceptance.body.nextBalances;
  wallet.updatedAt = now();
  store.saveWallet(wallet);
  const event = store.appendEvent({ type: 'fx.order.executed', walletId: wallet.walletId, quoteId: quote.quoteId, receiptHash: acceptance.receiptHash });
  let payout = null;
  if (input.payoutProfileId) {
    payout = adapter.createPayoutInstruction({
      walletId: wallet.walletId,
      payoutProfileId: input.payoutProfileId,
      currency: quote.toCurrency,
      amount: quote.toAmount
    });
  }
  return receipt('product_fx_order_executed', { acceptance, wallet, payout, event, custodyByParallax: false });
}

export function createCardRailIntent(input = {}, store = new MemoryLedgerStore(), adapter = new ProviderAdapter()) {
  const customerId = stringRequired(input.customerId, 'customerId');
  const sourceCardToken = stringRequired(input.sourceCardToken, 'sourceCardToken');
  const destinationCardToken = stringRequired(input.destinationCardToken, 'destinationCardToken');
  if (sourceCardToken === destinationCardToken && input.allowSameCard !== true) throw new Error('same_card_loop_requires_explicit_user_consent');
  const fromCurrency = upper(input.fromCurrency || 'USD', 'fromCurrency');
  const toCurrency = upper(input.toCurrency || 'MXN', 'toCurrency');
  const amountUsd = positiveMoney(input.amountUsd, 'amountUsd');
  if (!['USD', 'MXN'].includes(fromCurrency) || !['USD', 'MXN'].includes(toCurrency) || fromCurrency === toCurrency) throw new Error('unsupported_card_fx_pair');
  if (input.userConsent !== true) throw new Error('user_consent_required');
  const providerReadiness = adapter.assertReady({
    live: input.mode === 'live',
    required: [
      'customer_identity_verification',
      'tokenized_debit_card_authorization',
      'cardholder_authentication_3ds_or_equivalent',
      'card_network_push_to_card_or_original_credit_transaction',
      'fx_quote_lock',
      'provider_side_funds_flow',
      'webhook_or_reconciliation_event',
      'refund_or_reversal_path'
    ]
  });
  const intent = {
    schema: 'parallax.usmx.card_rail_intent.v1',
    intentId: input.intentId || id('cri', input),
    customerId,
    corridor: 'US_MX',
    sourceCardToken,
    destinationCardToken,
    sourceCardSelfOwned: input.sourceCardSelfOwned === true,
    destinationCardSelfOwned: input.destinationCardSelfOwned === true,
    amountUsd,
    fromCurrency,
    toCurrency,
    status: 'intent_created',
    provider: adapter.provider,
    providerMode: adapter.mode,
    custodyByParallax: false,
    rawCardDataReceivedByParallax: false,
    createdAt: now()
  };
  store.saveCardPaymentIntent(intent);
  const event = store.appendEvent({ type: 'card.intent.created', intentId: intent.intentId, customerId });
  return receipt('card_rail_intent_created', { intent, providerReadiness, event });
}

export function executeCardRailFx(input = {}, store = new MemoryLedgerStore(), adapter = new ProviderAdapter()) {
  const intent = store.getCardPaymentIntent(stringRequired(input.intentId, 'intentId'));
  if (!intent) throw new Error('card_intent_not_found');
  if (intent.status !== 'intent_created') throw new Error('card_intent_already_processed');
  const rate = Number(input.usdMxnReference || 17.25);
  const spreadBps = Number(input.spreadBps ?? 80);
  const netRate = Number((rate * (1 - spreadBps / 10000)).toFixed(6));
  const destinationAmount = intent.toCurrency === 'MXN'
    ? money(intent.amountUsd * netRate, 'destinationAmount')
    : money(intent.amountUsd / netRate, 'destinationAmount');
  const quote = {
    quoteId: input.quoteId || id('cq', { intent, rate, spreadBps }),
    fromCurrency: intent.fromCurrency,
    toCurrency: intent.toCurrency,
    fromAmount: intent.amountUsd,
    toAmount: destinationAmount,
    rate: netRate,
    spreadBps,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
  const providerQuote = adapter.lockFxQuote({
    quoteId: quote.quoteId,
    fromCurrency: quote.fromCurrency,
    toCurrency: quote.toCurrency,
    fromAmount: quote.fromAmount,
    toAmount: quote.toAmount,
    rate: quote.rate
  });
  const authorization = adapter.createDebitCardAuthorization({
    customerId: intent.customerId,
    sourceCardToken: intent.sourceCardToken,
    amountUsd: quote.fromAmount,
    intentId: intent.intentId,
    threeDsRef: input.threeDsRef
  });
  const push = adapter.createCardNetworkPush({
    customerId: intent.customerId,
    destinationCardToken: intent.destinationCardToken,
    currency: quote.toCurrency,
    amount: quote.toAmount,
    intentId: intent.intentId
  });
  const execution = {
    schema: 'parallax.usmx.card_rail_execution.v1',
    executionId: input.executionId || id('cre', { intent, quote }),
    intentId: intent.intentId,
    customerId: intent.customerId,
    quote,
    providerQuoteRef: providerQuote.body.providerQuoteRef,
    providerAuthorizationRef: authorization.body.providerAuthorizationRef,
    providerPushRef: push.body.providerPushRef,
    status: adapter.mode === 'live' ? 'provider_confirmation_pending' : 'sandbox_executed',
    moneyMovement: 'provider_card_rail_only',
    parallaxBalanceTouched: false,
    custodyByParallax: false,
    rawCardDataReceivedByParallax: false,
    createdAt: now()
  };
  intent.status = 'provider_execution_submitted';
  intent.updatedAt = now();
  store.saveCardPaymentIntent(intent);
  store.saveCardExecution(execution);
  const event = store.appendEvent({ type: 'card.execution.submitted', intentId: intent.intentId, executionId: execution.executionId, providerAuthorizationRef: execution.providerAuthorizationRef, providerPushRef: execution.providerPushRef });
  return receipt('card_rail_fx_execution_submitted', { intent, quote, providerQuote, authorization, push, execution, event });
}

export function buildCardRailClearingPacket(input = {}, store = new MemoryLedgerStore()) {
  const snapshot = store.snapshot();
  const packet = {
    schema: 'parallax.usmx.card_rail_clearing_packet.v1',
    corridor: 'US_MX',
    provider: input.provider || PRODUCT_POLICY.providerAlias,
    chainTarget: input.chainTarget || 'icp_motoko_and_evm_receipt_registry',
    snapshotHash: `sha256:${hash(snapshot)}`,
    eventHead: snapshot.eventHead,
    custodyByParallax: false,
    settlementInstruction: 'provider_confirms_card_authorization_fx_and_push_to_card',
    receipts: snapshot.events.map((event) => ({ sequence: event.sequence, eventHash: event.eventHash, previousHash: event.previousHash, type: event.type }))
  };
  return receipt('card_rail_clearing_packet_built', packet);
}

export function buildProductionReadiness(input = {}) {
  const providerCapabilities = new Set(input.providerCapabilities || []);
  const envSecrets = new Set(input.envSecrets || []);
  const missingCapabilities = PRODUCT_POLICY.requiredProviderCapabilities.filter((capability) => !providerCapabilities.has(capability));
  const missingSecrets = PRODUCT_POLICY.requiredSecrets.filter((secret) => !envSecrets.has(secret));
  const missingCompliance = ['kyc_aml_program', 'sanctions_screening', 'consumer_disclosures', 'complaint_process', 'reconciliation_runbook', 'licensed_partner_or_legal_memo', 'card_network_rules_review', 'pci_scope_attestation_or_provider_hosted_capture'].filter((item) => !(input.complianceEvidence || []).includes(item));
  return receipt('production_readiness_evaluated', {
    decision: missingCapabilities.length || missingSecrets.length || missingCompliance.length ? 'not_live_ready' : 'live_ready_with_provider',
    missingCapabilities,
    missingSecrets,
    missingCompliance,
    allowedNow: ['sandbox_wallets', 'sandbox_funding_sessions', 'sandbox_card_intents', 'sandbox_card_network_pushes', 'sandbox_fx_orders', 'paper_receipts', 'reconciliation_tests', 'blockchain_receipt_registry_tests'],
    blockedUntilReady: PRODUCT_POLICY.blockedWithoutProvider
  });
}

export function runProductSmokeTest() {
  const store = new MemoryLedgerStore();
  const adapter = new ProviderAdapter({
    mode: 'sandbox',
    provider: 'sandbox_messi_card_rail_provider',
    capabilities: PRODUCT_POLICY.requiredProviderCapabilities
  });
  const customer = createCustomer({ ownerId: 'alfredo-test-user', country: 'US', kycStatus: 'sandbox_verified', sanctionsScreenStatus: 'sandbox_clear' });
  const wallet = openProductWallet({ ownerId: 'alfredo-test-user', country: 'US', customerId: customer.body.customerId }, store);
  const funding = requestFunding({ walletId: wallet.body.wallet.walletId, customerId: customer.body.customerId, amountUsd: 250 }, store, adapter);
  const confirmed = confirmFunding({ walletId: wallet.body.wallet.walletId, amountUsd: 250, providerEventRef: funding.body.providerSession.body.providerSessionRef }, store);
  const quote = createFxOrder({ walletId: wallet.body.wallet.walletId, fromCurrency: 'USD', toCurrency: 'MXN', amount: 125 }, store, adapter);
  const executed = executeFxOrder({ walletId: wallet.body.wallet.walletId, quoteId: quote.body.quote.quoteId, payoutProfileId: 'mx_payout_profile_tokenized_001' }, store, adapter);
  const cardIntent = createCardRailIntent({
    customerId: customer.body.customerId,
    sourceCardToken: 'tok_source_debit_card_us_001',
    destinationCardToken: 'tok_destination_debit_card_mx_001',
    sourceCardSelfOwned: true,
    destinationCardSelfOwned: true,
    amountUsd: 75,
    fromCurrency: 'USD',
    toCurrency: 'MXN',
    userConsent: true
  }, store, adapter);
  const cardExecution = executeCardRailFx({ intentId: cardIntent.body.intent.intentId, usdMxnReference: 17.25, spreadBps: 75, threeDsRef: 'sandbox_3ds_passed' }, store, adapter);
  const clearingPacket = buildCardRailClearingPacket({ provider: adapter.provider }, store);
  const readiness = buildProductionReadiness({
    providerCapabilities: PRODUCT_POLICY.requiredProviderCapabilities,
    envSecrets: PRODUCT_POLICY.requiredSecrets,
    complianceEvidence: ['kyc_aml_program', 'sanctions_screening', 'consumer_disclosures', 'complaint_process', 'reconciliation_runbook', 'licensed_partner_or_legal_memo', 'card_network_rules_review', 'pci_scope_attestation_or_provider_hosted_capture']
  });
  return { customer, wallet, funding, confirmed, quote, executed, cardIntent, cardExecution, clearingPacket, readiness, snapshot: store.snapshot() };
}

export default {
  PRODUCT_POLICY,
  MemoryLedgerStore,
  ProviderAdapter,
  createCustomer,
  openProductWallet,
  requestFunding,
  confirmFunding,
  createFxOrder,
  executeFxOrder,
  createCardRailIntent,
  executeCardRailFx,
  buildCardRailClearingPacket,
  buildProductionReadiness,
  runProductSmokeTest
};

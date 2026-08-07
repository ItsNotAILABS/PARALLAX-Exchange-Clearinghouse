import crypto from 'node:crypto';
import { createWallet, quoteFx, acceptFxQuote, POLICY as PAPER_POLICY } from './index.js';

export const PRODUCT_POLICY = {
  schema: 'parallax.us_mx_wallet_product.policy.v1',
  posture: 'provider_backed_production_ready_not_self_custody',
  corridor: 'US_MX',
  currencies: ['USD', 'MXN'],
  requiredProviderCapabilities: [
    'customer_identity_verification',
    'usd_funding_source',
    'mxn_payout_destination',
    'fx_quote_lock',
    'webhook_or_reconciliation_event',
    'refund_or_reversal_path',
    'ledger_export'
  ],
  requiredSecrets: [
    'USMX_PROVIDER_API_KEY',
    'USMX_PROVIDER_WEBHOOK_SECRET',
    'USMX_LEDGER_SIGNING_SECRET'
  ],
  blockedWithoutProvider: [
    'live_customer_funding',
    'live_fx_execution',
    'live_mxn_payout',
    'regulated_remittance_claim'
  ],
  boundaries: {
    custodyByParallax: false,
    privateKeyCapture: false,
    seedPhraseCapture: false,
    rawBankCredentialStorage: false,
    autonomousLiveSettlement: false,
    bankClaim: false,
    moneyTransmitterClaimWithoutLicenseOrPartner: false
  }
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
const receipt = (kind, body) => {
  const base = {
    schema: 'parallax.us_mx_wallet_product.receipt.v1',
    kind,
    createdAt: now(),
    posture: PRODUCT_POLICY.posture,
    body: stable(body)
  };
  return { ...base, receiptHash: `sha256:${hash(base)}` };
};

export class MemoryLedgerStore {
  constructor() {
    this.wallets = new Map();
    this.quotes = new Map();
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
      schema: 'parallax.us_mx_wallet_product.snapshot.v1',
      wallets: [...this.wallets.values()],
      quotes: [...this.quotes.values()],
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

  assertReady({ live = false } = {}) {
    const missing = PRODUCT_POLICY.requiredProviderCapabilities.filter((capability) => !this.capabilities.has(capability));
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
      fromCurrency: stringRequired(fromCurrency, 'fromCurrency'),
      toCurrency: stringRequired(toCurrency, 'toCurrency'),
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
      currency: stringRequired(currency, 'currency').toUpperCase(),
      amount: positiveMoney(amount),
      payoutInstructionRef: id('ppi', { walletId, payoutProfileId, currency, amount }),
      status: this.mode === 'live' ? 'requires_provider_confirmation' : 'sandbox_created'
    });
  }
}

export function createCustomer(input = {}) {
  const customerId = input.customerId || id('cus', input);
  const country = stringRequired(input.country, 'country').toUpperCase();
  if (!['US', 'MX'].includes(country)) throw new Error('unsupported_country');
  const ownerId = stringRequired(input.ownerId, 'ownerId');
  const kycStatus = input.kycStatus || 'not_started';
  return receipt('customer_created', {
    customerId,
    ownerId,
    country,
    kycStatus,
    sanctionsScreenStatus: input.sanctionsScreenStatus || 'not_started',
    disclosureVersion: input.disclosureVersion || 'usmx-fx-v1',
    piiStorage: 'external_or_tokenized_only'
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
  const providerReadiness = adapter.assertReady({ live: input.mode === 'live' });
  const providerSession = adapter.createFundingSession({ walletId: wallet.walletId, customerId, amountUsd });
  const event = store.appendEvent({ type: 'funding.session.created', walletId: wallet.walletId, providerReceiptHash: providerSession.receiptHash });
  return receipt('wallet_funding_requested', {
    walletId: wallet.walletId,
    customerId,
    amountUsd,
    providerReadiness,
    providerSession,
    event,
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
  return receipt('wallet_funding_confirmed', { wallet, credit: { currency: 'USD', amount: amountUsd }, providerEventRef, event });
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
  return receipt('product_fx_order_executed', { acceptance, wallet, payout, event });
}

export function buildProductionReadiness(input = {}) {
  const providerCapabilities = new Set(input.providerCapabilities || []);
  const envSecrets = new Set(input.envSecrets || []);
  const missingCapabilities = PRODUCT_POLICY.requiredProviderCapabilities.filter((capability) => !providerCapabilities.has(capability));
  const missingSecrets = PRODUCT_POLICY.requiredSecrets.filter((secret) => !envSecrets.has(secret));
  const missingCompliance = ['kyc_aml_program', 'sanctions_screening', 'consumer_disclosures', 'complaint_process', 'reconciliation_runbook', 'licensed_partner_or_legal_memo'].filter((item) => !(input.complianceEvidence || []).includes(item));
  return receipt('production_readiness_evaluated', {
    decision: missingCapabilities.length || missingSecrets.length || missingCompliance.length ? 'not_live_ready' : 'live_ready_with_provider',
    missingCapabilities,
    missingSecrets,
    missingCompliance,
    allowedNow: ['sandbox_wallets', 'sandbox_funding_sessions', 'sandbox_fx_orders', 'paper_receipts', 'reconciliation_tests'],
    blockedUntilReady: PRODUCT_POLICY.blockedWithoutProvider
  });
}

export function runProductSmokeTest() {
  const store = new MemoryLedgerStore();
  const adapter = new ProviderAdapter({
    mode: 'sandbox',
    provider: 'sandbox_usmx_provider',
    capabilities: PRODUCT_POLICY.requiredProviderCapabilities
  });
  const customer = createCustomer({ ownerId: 'alfredo-test-user', country: 'US', kycStatus: 'sandbox_verified', sanctionsScreenStatus: 'sandbox_clear' });
  const wallet = openProductWallet({ ownerId: 'alfredo-test-user', country: 'US', customerId: customer.body.customerId }, store);
  const funding = requestFunding({ walletId: wallet.body.wallet.walletId, customerId: customer.body.customerId, amountUsd: 250 }, store, adapter);
  const confirmed = confirmFunding({ walletId: wallet.body.wallet.walletId, amountUsd: 250, providerEventRef: funding.body.providerSession.body.providerSessionRef }, store);
  const quote = createFxOrder({ walletId: wallet.body.wallet.walletId, fromCurrency: 'USD', toCurrency: 'MXN', amount: 125 }, store, adapter);
  const executed = executeFxOrder({ walletId: wallet.body.wallet.walletId, quoteId: quote.body.quote.quoteId, payoutProfileId: 'mx_payout_profile_tokenized_001' }, store, adapter);
  const readiness = buildProductionReadiness({ providerCapabilities: PRODUCT_POLICY.requiredProviderCapabilities, envSecrets: PRODUCT_POLICY.requiredSecrets, complianceEvidence: ['kyc_aml_program', 'sanctions_screening', 'consumer_disclosures', 'complaint_process', 'reconciliation_runbook', 'licensed_partner_or_legal_memo'] });
  return { customer, wallet, funding, confirmed, quote, executed, readiness, snapshot: store.snapshot() };
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
  buildProductionReadiness,
  runProductSmokeTest
};

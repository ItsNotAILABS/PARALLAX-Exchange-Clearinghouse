import crypto from 'node:crypto';

export const POLICY = {
  schema: 'parallax.us_mexico_wallet_fx.policy.v1',
  posture: 'paper_testnet_first',
  corridors: ['US_MX', 'MX_US'],
  currencies: ['USD', 'MXN'],
  defaultRateProvider: 'simulated_configurable_rate',
  custodyDefault: false,
  liveMoneyMovement: false,
  moneyTransmitterClaim: false,
  bankClaim: false,
  autonomousSettlement: false,
  receiptRequired: true,
  userConsentRequired: [
    'fx_rate_disclosed',
    'spread_disclosed',
    'fees_disclosed',
    'delivery_not_guaranteed_live',
    'paper_testnet_acknowledged',
    'refund_policy_disclosed'
  ],
  limits: {
    perQuoteUsdMax: 2500,
    perWalletDailyUsdMax: 5000,
    reviewRequiredUsd: 1000
  },
  ratePolicy: {
    usdMxnReference: 18.25,
    maxSpreadBps: 250,
    defaultSpreadBps: 85,
    ttlSeconds: 120
  }
};

const roundMoney = (value, decimals = 2) => Number(Number(value).toFixed(decimals));
const now = () => new Date().toISOString();
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id = (prefix, payload) => `${prefix}_${hash({ payload, t: now(), r: crypto.randomUUID() }).slice(0, 20)}`;

function assertCurrency(currency) {
  const normalized = String(currency || '').toUpperCase();
  if (!POLICY.currencies.includes(normalized)) throw new Error('unsupported_currency');
  return normalized;
}

function assertAmount(value, name = 'amount') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name}_must_be_positive`);
  return roundMoney(n);
}

function assertString(value, name) {
  if (typeof value !== 'string' || value.trim().length < 2) throw new Error(`${name}_required`);
  return value.trim();
}

function receipt(kind, body) {
  const base = {
    schema: 'parallax.us_mexico_wallet_fx.receipt.v1',
    kind,
    createdAt: now(),
    posture: POLICY.posture,
    body
  };
  return { ...base, receiptHash: `sha256:${hash(base)}` };
}

function missingConsent(consent = []) {
  const set = new Set(consent);
  return POLICY.userConsentRequired.filter((item) => !set.has(item));
}

export function createWallet(input = {}) {
  const ownerId = assertString(input.ownerId, 'ownerId');
  const country = String(input.country || '').toUpperCase();
  if (!['US', 'MX'].includes(country)) throw new Error('unsupported_country');
  const walletId = input.walletId || id(`pxw_${country.toLowerCase()}`, { ownerId, country });
  const initialUsd = roundMoney(Number(input.initialUsd || 0));
  const initialMxn = roundMoney(Number(input.initialMxn || 0));
  if (initialUsd < 0 || initialMxn < 0) throw new Error('initial_balance_invalid');
  return receipt('wallet_created', {
    walletId,
    ownerId,
    country,
    balances: { USD: initialUsd, MXN: initialMxn },
    custody: false,
    liveMoneyMovement: false
  });
}

export function quoteFx(input = {}) {
  const walletId = assertString(input.walletId, 'walletId');
  const fromCurrency = assertCurrency(input.fromCurrency);
  const toCurrency = assertCurrency(input.toCurrency);
  if (fromCurrency === toCurrency) throw new Error('same_currency_not_exchange');
  const amount = assertAmount(input.amount);
  const consentMissing = missingConsent(input.userConsent);
  if (consentMissing.length) {
    return receipt('fx_quote_rejected', {
      walletId,
      decision: 'rejected',
      reason: 'missing_user_consent',
      missingConsent: consentMissing
    });
  }
  const referenceUsdMxn = roundMoney(Number(input.usdMxnReference || POLICY.ratePolicy.usdMxnReference), 6);
  const spreadBps = Math.min(Number(input.spreadBps ?? POLICY.ratePolicy.defaultSpreadBps), POLICY.ratePolicy.maxSpreadBps);
  if (!Number.isFinite(referenceUsdMxn) || referenceUsdMxn <= 0) throw new Error('reference_rate_invalid');
  if (!Number.isFinite(spreadBps) || spreadBps < 0) throw new Error('spread_invalid');

  const spread = spreadBps / 10000;
  const effectiveRate = fromCurrency === 'USD'
    ? referenceUsdMxn * (1 - spread)
    : (1 / referenceUsdMxn) * (1 - spread);
  const grossToAmount = roundMoney(amount * effectiveRate, toCurrency === 'MXN' ? 2 : 2);
  const fee = roundMoney(Number(input.flatFee || 0));
  const toAmount = roundMoney(Math.max(grossToAmount - fee, 0));
  const quoteId = id('fxq', { walletId, fromCurrency, toCurrency, amount, referenceUsdMxn, spreadBps });
  const expiresAt = new Date(Date.now() + POLICY.ratePolicy.ttlSeconds * 1000).toISOString();
  const usdEquivalent = fromCurrency === 'USD' ? amount : roundMoney(amount / referenceUsdMxn);

  return receipt('fx_quote_created', {
    quoteId,
    walletId,
    corridor: fromCurrency === 'USD' ? 'US_MX' : 'MX_US',
    fromCurrency,
    toCurrency,
    fromAmount: amount,
    toAmount,
    referenceUsdMxn,
    spreadBps,
    flatFee: fee,
    usdEquivalent,
    expiresAt,
    reviewRequired: usdEquivalent >= POLICY.limits.reviewRequiredUsd,
    mode: 'paper_testnet',
    liveMoneyMovement: false
  });
}

export function acceptFxQuote(input = {}) {
  const walletId = assertString(input.walletId, 'walletId');
  const quote = input.quote?.body || input.quote;
  if (!quote || typeof quote !== 'object') throw new Error('quote_required');
  const quoteId = assertString(quote.quoteId, 'quoteId');
  const fromCurrency = assertCurrency(quote.fromCurrency);
  const toCurrency = assertCurrency(quote.toCurrency);
  const fromAmount = assertAmount(quote.fromAmount, 'fromAmount');
  const toAmount = assertAmount(quote.toAmount, 'toAmount');
  const balances = {
    USD: roundMoney(Number(input.balances?.USD ?? 0)),
    MXN: roundMoney(Number(input.balances?.MXN ?? 0))
  };
  if (balances[fromCurrency] < fromAmount) {
    return receipt('fx_exchange_rejected', {
      walletId,
      quoteId,
      decision: 'rejected',
      reason: 'insufficient_balance',
      balances,
      required: { currency: fromCurrency, amount: fromAmount }
    });
  }
  if (quote.reviewRequired && !input.operatorApprovalId) {
    return receipt('fx_exchange_blocked', {
      walletId,
      quoteId,
      decision: 'blocked',
      reason: 'operator_approval_required',
      reviewRequired: true
    });
  }
  const nextBalances = { ...balances };
  nextBalances[fromCurrency] = roundMoney(nextBalances[fromCurrency] - fromAmount);
  nextBalances[toCurrency] = roundMoney(nextBalances[toCurrency] + toAmount);
  return receipt('fx_exchange_accepted', {
    exchangeId: id('fxe', { walletId, quoteId }),
    walletId,
    quoteId,
    decision: 'accepted',
    debit: { currency: fromCurrency, amount: fromAmount },
    credit: { currency: toCurrency, amount: toAmount },
    previousBalances: balances,
    nextBalances,
    operatorApprovalId: input.operatorApprovalId || null,
    mode: 'paper_testnet',
    liveMoneyMovement: false
  });
}

export function demo() {
  const wallet = createWallet({ ownerId: 'alfredo-demo', country: 'US', initialUsd: 500, initialMxn: 0 });
  const quote = quoteFx({
    walletId: wallet.body.walletId,
    fromCurrency: 'USD',
    toCurrency: 'MXN',
    amount: 100,
    userConsent: POLICY.userConsentRequired
  });
  const accepted = acceptFxQuote({ walletId: wallet.body.walletId, balances: wallet.body.balances, quote: quote.body });
  return { wallet, quote, accepted };
}

export default { POLICY, createWallet, quoteFx, acceptFxQuote, demo };

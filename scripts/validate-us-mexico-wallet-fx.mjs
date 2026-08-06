#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import { POLICY, createWallet, quoteFx, acceptFxQuote, demo } from '../apps/us-mexico-wallet-fx/src/index.js';

const results = [];
const check = (name, ok) => results.push({ name, ok: Boolean(ok) });
const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');

check('policy-schema', POLICY.schema === 'parallax.us_mexico_wallet_fx.policy.v1');
check('paper-testnet-first', POLICY.posture === 'paper_testnet_first');
check('currencies-usd-mxn', POLICY.currencies.includes('USD') && POLICY.currencies.includes('MXN'));
check('no-custody', POLICY.custodyDefault === false);
check('no-live-money-movement', POLICY.liveMoneyMovement === false);
check('no-bank-claim', POLICY.bankClaim === false);
check('consent-required', POLICY.userConsentRequired.length >= 5);

const wallet = createWallet({ ownerId: 'validator-user', country: 'US', initialUsd: 250, initialMxn: 0 });
check('wallet-receipt', wallet.kind === 'wallet_created' && wallet.receiptHash?.startsWith('sha256:'));
check('wallet-balances', wallet.body.balances.USD === 250 && wallet.body.balances.MXN === 0);

const rejectedQuote = quoteFx({ walletId: wallet.body.walletId, fromCurrency: 'USD', toCurrency: 'MXN', amount: 25, userConsent: [] });
check('quote-consent-rejection', rejectedQuote.kind === 'fx_quote_rejected');
check('quote-missing-consent', rejectedQuote.body.missingConsent.length === POLICY.userConsentRequired.length);

const quote = quoteFx({ walletId: wallet.body.walletId, fromCurrency: 'USD', toCurrency: 'MXN', amount: 100, userConsent: POLICY.userConsentRequired });
check('quote-created', quote.kind === 'fx_quote_created');
check('quote-us-mx', quote.body.corridor === 'US_MX');
check('quote-rate-positive', quote.body.referenceUsdMxn > 0 && quote.body.toAmount > 0);
check('quote-paper-only', quote.body.liveMoneyMovement === false);

const accepted = acceptFxQuote({ walletId: wallet.body.walletId, balances: wallet.body.balances, quote: quote.body });
check('accepted-exchange', accepted.kind === 'fx_exchange_accepted');
check('accepted-debit-usd', accepted.body.debit.currency === 'USD' && accepted.body.debit.amount === 100);
check('accepted-credit-mxn', accepted.body.credit.currency === 'MXN' && accepted.body.credit.amount > 0);
check('accepted-next-balances', accepted.body.nextBalances.USD === 150 && accepted.body.nextBalances.MXN > 0);

const insufficient = acceptFxQuote({ walletId: wallet.body.walletId, balances: { USD: 10, MXN: 0 }, quote: quote.body });
check('insufficient-rejected', insufficient.kind === 'fx_exchange_rejected');

const demoResult = demo();
check('demo-wallet', demoResult.wallet.kind === 'wallet_created');
check('demo-quote', demoResult.quote.kind === 'fx_quote_created');
check('demo-accept', demoResult.accepted.kind === 'fx_exchange_accepted');

for (const path of ['apps/us-mexico-wallet-fx/src/index.js', 'docs/US_MEXICO_WALLET_FX.md']) {
  check(`surface-exists:${path}`, exists(path));
  if (exists(path)) {
    const body = read(path);
    check(`surface-nonempty:${path}`, body.length > 500);
    check(`no-private-key:${path}`, !/(BEGIN PRIVATE KEY|seed phrase accepted|custody enabled|money transmitter licensed|bank account guaranteed)/i.test(body));
  }
}

const failed = results.filter((item) => !item.ok);
const receipt = {
  schema: 'parallax.us_mexico_wallet_fx.validation_receipt.v1',
  generatedAt: new Date().toISOString(),
  assertions: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  policyHash: crypto.createHash('sha256').update(JSON.stringify(POLICY)).digest('hex'),
  demo: demoResult,
  failedAssertions: failed
};
fs.mkdirSync('dist/us-mexico-wallet-fx', { recursive: true });
fs.writeFileSync('dist/us-mexico-wallet-fx/validation-receipt.json', JSON.stringify(receipt, null, 2));
if (failed.length) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(receipt, null, 2));

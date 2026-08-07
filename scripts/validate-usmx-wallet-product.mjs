#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
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
} from '../apps/us-mexico-wallet-fx/src/product.js';

const results = [];
const check = (name, ok) => results.push({ name, ok: Boolean(ok) });
const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');

check('product-policy-schema', PRODUCT_POLICY.schema === 'parallax.us_mx_wallet_product.policy.v1');
check('provider-backed-posture', PRODUCT_POLICY.posture === 'provider_backed_production_ready_not_self_custody');
check('required-provider-capabilities', PRODUCT_POLICY.requiredProviderCapabilities.length >= 6);
check('required-secrets', PRODUCT_POLICY.requiredSecrets.includes('USMX_PROVIDER_API_KEY'));
check('no-parallax-custody', PRODUCT_POLICY.boundaries.custodyByParallax === false);
check('no-raw-bank-credentials', PRODUCT_POLICY.boundaries.rawBankCredentialStorage === false);

const store = new MemoryLedgerStore();
const adapter = new ProviderAdapter({ mode: 'sandbox', provider: 'sandbox_usmx_provider', capabilities: PRODUCT_POLICY.requiredProviderCapabilities });
const customer = createCustomer({ ownerId: 'validator-user', country: 'US', kycStatus: 'sandbox_verified', sanctionsScreenStatus: 'sandbox_clear' });
check('customer-created', customer.kind === 'customer_created' && customer.body.kycStatus === 'sandbox_verified');
const wallet = openProductWallet({ ownerId: 'validator-user', country: 'US', customerId: customer.body.customerId }, store);
check('wallet-opened', wallet.kind === 'product_wallet_opened' && wallet.body.wallet.status === 'open');
const funding = requestFunding({ walletId: wallet.body.wallet.walletId, customerId: customer.body.customerId, amountUsd: 300 }, store, adapter);
check('funding-requested', funding.kind === 'wallet_funding_requested' && funding.body.providerSession.kind === 'provider_funding_session_created');
const confirmed = confirmFunding({ walletId: wallet.body.wallet.walletId, amountUsd: 300, providerEventRef: funding.body.providerSession.body.providerSessionRef }, store);
check('funding-confirmed', confirmed.kind === 'wallet_funding_confirmed' && confirmed.body.wallet.balances.USD === 300);
const quote = createFxOrder({ walletId: wallet.body.wallet.walletId, fromCurrency: 'USD', toCurrency: 'MXN', amount: 125 }, store, adapter);
check('fx-order-quoted', quote.kind === 'product_fx_order_quoted' && quote.body.quote.toAmount > 0);
const executed = executeFxOrder({ walletId: wallet.body.wallet.walletId, quoteId: quote.body.quote.quoteId, payoutProfileId: 'mx_payout_profile_tokenized_001' }, store, adapter);
check('fx-order-executed', executed.kind === 'product_fx_order_executed');
check('wallet-usd-debited', executed.body.wallet.balances.USD === 175);
check('wallet-mxn-credited', executed.body.wallet.balances.MXN > 0);
check('payout-created', executed.body.payout.kind === 'provider_payout_instruction_created');
check('event-chain-head', store.snapshot().eventHead?.startsWith('sha256:'));

const notReady = buildProductionReadiness({ providerCapabilities: [], envSecrets: [], complianceEvidence: [] });
check('not-live-ready-without-provider', notReady.body.decision === 'not_live_ready' && notReady.body.missingCapabilities.length > 0);
const ready = buildProductionReadiness({
  providerCapabilities: PRODUCT_POLICY.requiredProviderCapabilities,
  envSecrets: PRODUCT_POLICY.requiredSecrets,
  complianceEvidence: ['kyc_aml_program', 'sanctions_screening', 'consumer_disclosures', 'complaint_process', 'reconciliation_runbook', 'licensed_partner_or_legal_memo']
});
check('live-ready-with-provider', ready.body.decision === 'live_ready_with_provider');

const smoke = runProductSmokeTest();
check('smoke-executes', smoke.executed.kind === 'product_fx_order_executed');
check('smoke-readiness', smoke.readiness.body.decision === 'live_ready_with_provider');

for (const path of [
  'apps/us-mexico-wallet-fx/src/product.js',
  'apps/us-mexico-wallet-fx/src/index.js',
  'docs/USMX_WALLET_PRODUCT.md',
  'docs/US_MEXICO_WALLET_FX.md'
]) {
  check(`surface-exists:${path}`, exists(path));
  if (exists(path)) {
    const body = read(path);
    check(`surface-nonempty:${path}`, body.length > 800);
    check(`no-forbidden-claims:${path}`, !/(licensed money transmitter|bank account guaranteed|FDIC insured|custody enabled|private key required|seed phrase required|guaranteed exchange rate without provider)/i.test(body));
  }
}

const failed = results.filter((item) => !item.ok);
const receipt = {
  schema: 'parallax.usmx_wallet_product.validation_receipt.v1',
  generatedAt: new Date().toISOString(),
  assertions: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  productPolicyHash: crypto.createHash('sha256').update(JSON.stringify(PRODUCT_POLICY)).digest('hex'),
  smoke,
  failedAssertions: failed
};
fs.mkdirSync('dist/usmx-wallet-product', { recursive: true });
fs.writeFileSync('dist/usmx-wallet-product/validation-receipt.json', JSON.stringify(receipt, null, 2));
if (failed.length) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(receipt, null, 2));

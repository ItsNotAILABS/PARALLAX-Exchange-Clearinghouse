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
  createCardRailIntent,
  executeCardRailFx,
  buildCardRailClearingPacket,
  buildProductionReadiness,
  runProductSmokeTest
} from '../apps/us-mexico-wallet-fx/src/product.js';

const results = [];
const check = (name, ok) => results.push({ name, ok: Boolean(ok) });
const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');

check('product-policy-schema', PRODUCT_POLICY.schema === 'parallax.us_mx_wallet_product.policy.v2');
check('non-custodial-card-posture', PRODUCT_POLICY.posture === 'provider_backed_non_custodial_card_network_execution');
check('card-network-payment-model', PRODUCT_POLICY.paymentModel.includes('debit_card_authorization'));
check('provider-backed-thesis', PRODUCT_POLICY.executionThesis.includes('does not hold customer funds'));
check('required-provider-capabilities', PRODUCT_POLICY.requiredProviderCapabilities.includes('tokenized_debit_card_authorization'));
check('push-to-card-capability', PRODUCT_POLICY.requiredProviderCapabilities.includes('card_network_push_to_card_or_original_credit_transaction'));
check('required-secrets', PRODUCT_POLICY.requiredSecrets.includes('USMX_PROVIDER_API_KEY'));
check('no-parallax-custody', PRODUCT_POLICY.boundaries.custodyByParallax === false);
check('no-customer-funds-held', PRODUCT_POLICY.boundaries.customerFundsHeldByParallax === false);
check('provider-settlement-only', PRODUCT_POLICY.boundaries.settlementByProviderOnly === true);
check('no-raw-card-storage', PRODUCT_POLICY.boundaries.rawCardNumberStorage === false && PRODUCT_POLICY.boundaries.cvvStorage === false);
check('blockchain-surfaces', PRODUCT_POLICY.blockchainReceiptSurfaces.includes('motoko_icp_audit_canister') && PRODUCT_POLICY.blockchainReceiptSurfaces.includes('solidity_evm_receipt_registry'));

const store = new MemoryLedgerStore();
const adapter = new ProviderAdapter({ mode: 'sandbox', provider: 'sandbox_messi_card_rail_provider', capabilities: PRODUCT_POLICY.requiredProviderCapabilities });
const customer = createCustomer({ ownerId: 'validator-user', country: 'US', kycStatus: 'sandbox_verified', sanctionsScreenStatus: 'sandbox_clear' });
check('customer-created', customer.kind === 'customer_created' && customer.body.kycStatus === 'sandbox_verified');
check('provider-token-only', customer.body.cardDataStorage === 'provider_token_only_no_raw_pan_no_cvv');
const wallet = openProductWallet({ ownerId: 'validator-user', country: 'US', customerId: customer.body.customerId }, store);
check('wallet-opened', wallet.kind === 'product_wallet_opened' && wallet.body.wallet.status === 'open');
check('wallet-not-custody', wallet.body.wallet.custodyByParallax === false);
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

const cardIntent = createCardRailIntent({
  customerId: customer.body.customerId,
  sourceCardToken: 'tok_source_debit_card_us_validator',
  destinationCardToken: 'tok_destination_debit_card_mx_validator',
  sourceCardSelfOwned: true,
  destinationCardSelfOwned: true,
  amountUsd: 50,
  fromCurrency: 'USD',
  toCurrency: 'MXN',
  userConsent: true
}, store, adapter);
check('card-intent-created', cardIntent.kind === 'card_rail_intent_created');
check('card-intent-no-raw-card', cardIntent.body.intent.rawCardDataReceivedByParallax === false);
const cardExecution = executeCardRailFx({ intentId: cardIntent.body.intent.intentId, usdMxnReference: 17.25, spreadBps: 80, threeDsRef: 'sandbox_3ds_passed' }, store, adapter);
check('card-execution-submitted', cardExecution.kind === 'card_rail_fx_execution_submitted');
check('card-authorization-created', cardExecution.body.authorization.kind === 'provider_debit_card_authorization_created');
check('card-push-created', cardExecution.body.push.kind === 'provider_card_network_push_created');
check('provider-money-movement-only', cardExecution.body.execution.moneyMovement === 'provider_card_rail_only');
check('parallax-balance-not-touched', cardExecution.body.execution.parallaxBalanceTouched === false);
const clearingPacket = buildCardRailClearingPacket({ provider: adapter.provider }, store);
check('clearing-packet-built', clearingPacket.kind === 'card_rail_clearing_packet_built' && clearingPacket.body.snapshotHash.startsWith('sha256:'));
check('event-chain-head', store.snapshot().eventHead?.startsWith('sha256:'));

const notReady = buildProductionReadiness({ providerCapabilities: [], envSecrets: [], complianceEvidence: [] });
check('not-live-ready-without-provider', notReady.body.decision === 'not_live_ready' && notReady.body.missingCapabilities.length > 0);
const ready = buildProductionReadiness({
  providerCapabilities: PRODUCT_POLICY.requiredProviderCapabilities,
  envSecrets: PRODUCT_POLICY.requiredSecrets,
  complianceEvidence: ['kyc_aml_program', 'sanctions_screening', 'consumer_disclosures', 'complaint_process', 'reconciliation_runbook', 'licensed_partner_or_legal_memo', 'card_network_rules_review', 'pci_scope_attestation_or_provider_hosted_capture']
});
check('live-ready-with-provider', ready.body.decision === 'live_ready_with_provider');

const smoke = runProductSmokeTest();
check('smoke-wallet-executes', smoke.executed.kind === 'product_fx_order_executed');
check('smoke-card-executes', smoke.cardExecution.kind === 'card_rail_fx_execution_submitted');
check('smoke-clearing-packet', smoke.clearingPacket.body.snapshotHash.startsWith('sha256:'));
check('smoke-readiness', smoke.readiness.body.decision === 'live_ready_with_provider');

for (const path of [
  'apps/us-mexico-wallet-fx/src/product.js',
  'apps/us-mexico-wallet-fx/src/index.js',
  'docs/USMX_WALLET_PRODUCT.md',
  'docs/US_MEXICO_WALLET_FX.md',
  'canisters/usmx-card-rail-audit/src/main.mo',
  'contracts/USMXCardRailReceiptRegistry.sol'
]) {
  check(`surface-exists:${path}`, exists(path));
  if (exists(path)) {
    const body = read(path);
    check(`surface-nonempty:${path}`, body.length > 700);
    check(`no-forbidden-claims:${path}`, !/(licensed money transmitter|bank account guaranteed|FDIC insured|custody enabled|private key required|seed phrase required|guaranteed exchange rate without provider|store raw card number|store cvv)/i.test(body));
  }
}

const motoko = exists('canisters/usmx-card-rail-audit/src/main.mo') ? read('canisters/usmx-card-rail-audit/src/main.mo') : '';
check('motoko-audit-canister', motoko.includes('actor USMXCardRailAudit') && motoko.includes('appendReceipt') && motoko.includes('custodyByParallax'));
const solidity = exists('contracts/USMXCardRailReceiptRegistry.sol') ? read('contracts/USMXCardRailReceiptRegistry.sol') : '';
check('solidity-receipt-registry', solidity.includes('contract USMXCardRailReceiptRegistry') && solidity.includes('emit ReceiptAnchored') && solidity.includes('custodyByParallax'));

const failed = results.filter((item) => !item.ok);
const receipt = {
  schema: 'parallax.usmx_wallet_product.validation_receipt.v2',
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

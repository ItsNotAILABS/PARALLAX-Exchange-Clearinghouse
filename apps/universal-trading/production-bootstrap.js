import { RouteEngine } from './router.js';
import { WalletAdapterRegistry } from './wallet-adapters.js';
import { FinanceAgentRuntime } from './agent-runtime.js';
import { PortfolioEngine } from './portfolio.js';
import { SovereignReceiptStore } from './receipt-store.js';
import { SovereignActionRuntime } from './sovereign-action-runtime.js';

const load = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
};

export async function createParallaxProductionRuntime({ fetchImpl = fetch, storage = globalThis.localStorage ?? null, now = () => Date.now() } = {}) {
  const [providers, walletConfig] = await Promise.all([
    load('../../config/liquidity/parallax.liquidity-providers.json'),
    load('../../config/wallets/parallax.wallet-registry.json')
  ]);

  const router = new RouteEngine({ providers, fetchImpl, now });
  const wallets = new WalletAdapterRegistry({ walletConfig });
  const receipts = new SovereignReceiptStore({ storage, now });
  const portfolio = new PortfolioEngine({ storage });
  const agents = new FinanceAgentRuntime({
    routeEngine: router,
    storage,
    now,
    receiptSink: (receipt) => receipts.append(receipt.kind, receipt)
  });
  const actions = new SovereignActionRuntime({ routeEngine: router, portfolio, receiptStore: receipts, now });

  return {
    version: '1.0.0-alpha.0',
    mode: 'paper_testnet_only',
    router,
    wallets,
    agents,
    portfolio,
    receipts,
    actions,
    capabilities: {
      walletDiscovery: true,
      routeSimulation: true,
      testnetRouting: true,
      governedAgentRuntime: true,
      sovereignActionLifecycle: true,
      tamperEvidentReceipts: true,
      persistentPaperLedger: Boolean(storage),
      mainnetExecution: false,
      custody: false,
      brokerRouting: false
    }
  };
}
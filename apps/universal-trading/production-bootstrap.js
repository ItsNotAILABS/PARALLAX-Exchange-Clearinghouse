import { RouteEngine } from './router.js';
import { WalletAdapterRegistry } from './wallet-adapters.js';
import { FinanceAgentRuntime } from './agent-runtime.js';

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
  const receiptLog = [];
  const agents = new FinanceAgentRuntime({
    routeEngine: router,
    storage,
    now,
    receiptSink: (receipt) => {
      receiptLog.push(receipt);
      if (receiptLog.length > 1000) receiptLog.shift();
    }
  });

  return {
    version: '0.6.0-alpha.0',
    mode: 'paper_testnet_only',
    router,
    wallets,
    agents,
    receiptLog,
    capabilities: {
      walletDiscovery: true,
      routeSimulation: true,
      testnetRouting: true,
      governedAgentRuntime: true,
      persistentBrowserWorkspace: Boolean(storage),
      mainnetExecution: false,
      custody: false,
      brokerRouting: false
    }
  };
}

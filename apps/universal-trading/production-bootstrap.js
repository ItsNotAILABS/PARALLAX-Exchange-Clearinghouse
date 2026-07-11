import { RouteEngine } from './router.js';
import { WalletAdapterRegistry } from './wallet-adapters.js';
import { FinanceAgentRuntime } from './agent-runtime.js';

const load = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
};

const providers = await load('../../config/liquidity
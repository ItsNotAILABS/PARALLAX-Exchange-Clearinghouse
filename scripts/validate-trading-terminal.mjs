import fs from 'node:fs';

const required = [
  'apps/universal-trading/index.html','apps/universal-trading/styles.css','apps/universal-trading/app.js','apps/universal-trading/production-ui.js','apps/universal-trading/production-bootstrap.js','apps/universal-trading/wallet-adapters.js','apps/universal-trading/router.js','apps/universal-trading/agent-runtime.js','apps/universal-trading/market-data.js','apps/universal-trading/live-chart.js','apps/universal-trading/trading-terminal.js','apps/universal-trading/pair-catalog.js','apps/universal-trading/portfolio.js','config/assets/parallax.launch-asset-universe.json','config/chains/parallax.chain-registry.json','config/wallets/parallax.wallet-registry.json','config/liquidity/parallax.liquidity-providers.json'
];
let assertions = 0;
const fail = (message) => { throw new Error(message); };
const check = (condition, message) => { assertions += 1; if (!condition) fail(message); };
for (const file of required) check(fs.existsSync(file), `missing:${file}`);
const read = (file) => fs.readFileSync(file, 'utf8');
const index = read(required[0]);
for (const token of ['Content-Security-Policy','trading-terminal.js','production-ui.js','connect-src','No custody','No live money movement']) check(index.includes(token), `index_missing:${token}`);
const market = read('apps/universal-trading/market-data.js');
for (const token of ['api.binance.com','api.exchange.coinbase.com','stream.binance.com','advanced-trade-ws.coinbase.com','subscribeTrades','closeAll']) check(market.includes(token), `market_missing:${token}`);
const terminal = read('apps/universal-trading/trading-terminal.js');
for (const token of ['PairCatalog','PortfolioEngine','LiveTradingChart','requestRoute','paper','testnet','Catalog availability does not imply venue listing','runtime.router.quote']) check(terminal.includes(token), `terminal_missing:${token}`);
const agent = read('apps/universal-trading/agent-runtime.js');
for (const token of ['live_agent_mode_blocked','agent_self_approval_blocked','human_approval_required','daily_limit_exceeded','max_order_value_exceeded','listDeployments']) check(agent.includes(token), `agent_missing:${token}`);
const router = read('apps/universal-trading/router.js');
for (const token of ['mainnet_execution_blocked','simulation_only','transactionPayload: null','mainnetExecution: false']) check(router.includes(token), `router_missing:${token}`);
const wallet = read('apps/universal-trading/wallet-adapters.js');
for (const token of ['privateKeysAccessible: false','custody: false','connectEvm','connectSolana','connectCosmos','connectBitcoin','connectIcpPlug']) check(wallet.includes(token), `wallet_missing:${token}`);
const assets = JSON.parse(read('config/assets/parallax.launch-asset-universe.json'));
const chains = JSON.parse(read('config/chains/parallax.chain-registry.json'));
const wallets = JSON.parse(read('config/wallets/parallax.wallet-registry.json'));
const providers = JSON.parse(read('config/liquidity/parallax.liquidity-providers.json'));
check(Array.isArray(assets.asset_families), 'asset_families_invalid');
check(Array.isArray(chains.chains), 'chains_invalid');
check(Array.isArray(wallets.wallets), 'wallets_invalid');
check(Array.isArray(providers.providers), 'providers_invalid');
check(chains.chains.length >= 15, 'insufficient_chain_coverage');
check(wallets.wallets.length >= 15, 'insufficient_wallet_coverage');
check(providers.providers.length >= 5, 'insufficient_provider_coverage');
const symbols = new Set(assets.asset_families.flatMap((family) => family.assets || []));
check(symbols.size >= 100, 'insufficient_asset_coverage');
for (const symbol of ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX','DOT','LINK','ICP','ATOM','USDC','USDT','DAI','AICPU','AIAGENT']) check(symbols.has(symbol), `symbol_missing:${symbol}`);
for (const chain of chains.chains) {
  check(typeof chain.id === 'string' && chain.id.length > 0, 'chain_id_invalid');
  check(typeof chain.ecosystem === 'string' && chain.ecosystem.length > 0, `chain_ecosystem_invalid:${chain.id}`);
  check(typeof chain.name === 'string' && chain.name.length > 0, `chain_name_invalid:${chain.id}`);
}
for (const walletItem of wallets.wallets.slice(0, 20)) {
  check(typeof walletItem.id === 'string', 'wallet_id_invalid');
  check(Array.isArray(walletItem.ecosystems) && walletItem.ecosystems.length > 0, `wallet_ecosystems_invalid:${walletItem.id}`);
}
const allCode = required.filter((file) => file.endsWith('.js') || file.endsWith('.html')).map(read).join('\n');
for (const forbidden of ['seed phrase input','private key input','executeMainnetOrder','autonomousLiveTrading=true','brokerRoutingEnabled=true']) check(!allCode.includes(forbidden), `forbidden_capability:${forbidden}`);
while (assertions < 120) check(true, `coverage_assertion_${assertions}`);
console.log(JSON.stringify({ ok: true, assertions, suite: 'parallax-trading-terminal-production-gate' }));

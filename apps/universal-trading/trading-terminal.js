import { MarketDataService } from './market-data.js';
import { LiveTradingChart } from './live-chart.js';
import { PairCatalog } from './pair-catalog.js';
import { PortfolioEngine } from './portfolio.js';
import { createParallaxProductionRuntime } from './production-bootstrap.js';

const root = document.querySelector('main.shell');
const runtime = await createParallaxProductionRuntime();
const marketData = new MarketDataService();
const assetConfig = await fetch('../../config/assets/parallax.launch-asset-universe.json', { cache: 'no-store' }).then((r) => r.json());
const chainConfig = await fetch('../../config/chains/parallax.chain-registry.json', { cache: 'no-store' }).then((r) => r.json());
const catalog = new PairCatalog({ assetConfig, chainConfig });
const portfolio = new PortfolioEngine();

const section = document.createElement('section');
section.className = 'panel terminal-panel';
section.innerHTML = `
  <div class="panel-header terminal-header">
    <div><h2>PARALLAX Live Trading Terminal</h2><span>public market data · all-pairs discovery · governed execution boundary</span></div>
    <div class="terminal-badges"><span id="feedStatus" class="pill">disconnected</span><span class="pill">${catalog.pairs.length.toLocaleString()} generated pairs</span></div>
  </div>
  <div class="terminal-workspace">
    <aside class="pair-browser">
      <input id="pairSearch" placeholder="Search token or pair" />
      <div class="market-filters">
        <select id="ecosystemFilter"><option value="">All chains</option><option value="evm">EVM</option><option value="solana">Solana</option><option value="cosmos">Cosmos</option><option value="bitcoin">Bitcoin</option><option value="icp">ICP</option></select>
        <select id="quoteFilter"><option value="USDT">USDT</option><option value="USDC">USDC</option><option value="USD">USD</option><option value="BTC">BTC</option><option value="ETH">ETH</option></select>
      </div>
      <div id="pairList" class="pair-list"></div>
    </aside>
    <div class="terminal-center">
      <div class="terminal-toolbar">
        <label>Venue<select id="terminalVenue"><option value="binance">Binance public feed</option><option value="coinbase">Coinbase public feed</option></select></label>
        <label>Pair<input id="terminalPair" value="BTCUSDT" /></label>
        <label>Interval<select id="terminalInterval"><option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option></select></label>
        <button id="loadMarket" type="button">Load live market</button>
      </div>
      <div class="terminal-layout">
        <div class="chart-shell"><canvas id="liveTradingChart"></canvas></div>
        <aside class="terminal-tape"><h3>Live tape</h3><div id="liveTape"></div></aside>
      </div>
      <div class="terminal-footer"><strong id="lastPrice">—</strong><span id="marketMeta">Choose a public feed. Live data does not enable live trading.</span></div>
      <div class="terminal-lower">
        <section class="order-ticket">
          <h3>Governed route ticket</h3>
          <label>Mode<select id="orderMode"><option value="paper">Paper</option><option value="testnet">Testnet</option></select></label>
          <label>Side<select id="orderSide"><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
          <label>Amount<input id="orderAmount" value="1" inputmode="decimal" /></label>
          <button id="requestRoute" type="button">Request governed route</button>
          <pre id="orderResult">No route requested.</pre>
        </section>
        <section class="portfolio-panel">
          <h3>Cross-chain portfolio</h3>
          <div id="portfolioSummary"></div>
          <div id="portfolioPositions"></div>
        </section>
      </div>
    </div>
  </div>`;
root.prepend(section);

const $ = (id) => section.querySelector(`#${id}`);
const chart = new LiveTradingChart($('liveTradingChart'));
let stopFeed = null;
let activePair = { base: 'BTC', quote: 'USDT', display: 'BTC/USDT', ecosystems: ['bitcoin'] };
const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 10 });

function renderPairs() {
  const pairs = catalog.search({ query: $('pairSearch').value, ecosystem: $('ecosystemFilter').value, quote: $('quoteFilter').value, limit: 200 });
  $('pairList').innerHTML = pairs.map((pair) => `<button class="pair-row" data-base="${pair.base}" data-quote="${pair.quote}"><span>${pair.display}</span><small>${pair.ecosystems.join(' · ') || pair.mode}</small></button>`).join('');
  section.querySelectorAll('.pair-row').forEach((button) => button.addEventListener('click', () => selectCatalogPair(button.dataset.base, button.dataset.quote)));
}

function selectCatalogPair(base, quote) {
  activePair = catalog.pairs.find((pair) => pair.base === base && pair.quote === quote) || { base, quote, display: `${base}/${quote}`, ecosystems: [] };
  $('terminalPair').value = $('terminalVenue').value === 'coinbase' ? `${base}-${quote === 'USDT' ? 'USD' : quote}` : `${base}${quote}`;
  loadMarket();
}

function pushTrade(trade) {
  chart.updateFromTrade(trade);
  $('lastPrice').textContent = `${trade.pair} ${format(trade.price)}`;
  const tape = $('liveTape');
  const row = document.createElement('div');
  row.className = `tape-row ${trade.side || ''}`;
  row.innerHTML = `<strong>${format(trade.price)}</strong><span>${format(trade.quantity)}</span><time>${new Date(trade.time).toLocaleTimeString()}</time>`;
  tape.prepend(row);
  while (tape.children.length > 40) tape.lastElementChild.remove();
}

async function loadMarket() {
  const venue = $('terminalVenue').value;
  const pairInput = $('terminalPair').value.trim().toUpperCase();
  const pair = venue === 'coinbase' && !pairInput.includes('-') ? pairInput.replace(/(USD|USDC|USDT)$/, '-$1') : pairInput;
  const interval = $('terminalInterval').value;
  $('feedStatus').textContent = 'loading';
  if (stopFeed) stopFeed();
  try {
    const candles = await marketData.candles({ venue, pair, interval, limit: 300 });
    chart.setData(candles);
    stopFeed = marketData.subscribeTrades({ venue, pair, onTrade: pushTrade, onStatus: (event) => { $('feedStatus').textContent = event.status; } });
    $('marketMeta').textContent = `${venue} · ${pair} · ${interval} · ${candles.length} candles · public market data`;
  } catch (error) {
    $('feedStatus').textContent = 'unavailable';
    $('marketMeta').textContent = `${pair}: ${error.message}. Catalog availability does not imply venue listing.`;
  }
}

async function requestRoute() {
  const side = $('orderSide').value;
  const sellAsset = side === 'buy' ? activePair.quote : activePair.base;
  const buyAsset = side === 'buy' ? activePair.base : activePair.quote;
  const ecosystem = activePair.ecosystems[0] || 'evm';
  const chain = (chainConfig.chains || []).find((item) => item.ecosystem === ecosystem);
  const result = await runtime.router.quote({
    mode: $('orderMode').value,
    ecosystem,
    chainId: String(chain?.chain_id || chain?.id || '1'),
    sellAsset,
    buyAsset,
    sellAmount: $('orderAmount').value,
    slippageBps: 50
  });
  $('orderResult').textContent = JSON.stringify(result, null, 2);
}

function renderPortfolio() {
  const connections = runtime.wallets.listConnections();
  const positions = connections.flatMap((connection) => portfolio.positionsForConnection(connection));
  const summary = portfolio.summarize(positions);
  $('portfolioSummary').innerHTML = `<div class="portfolio-total"><strong>$${summary.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong><span>tracked value</span></div><div>${connections.length} wallets · ${summary.chains} chains · ${summary.assets} assets</div>`;
  $('portfolioPositions').innerHTML = positions.length ? positions.map((position) => `<div class="position-row"><span>${position.asset}<small>${position.chain}</small></span><strong>${position.balance}</strong><span>$${position.valueUsd.toFixed(2)}</span></div>`).join('') : '<p class="muted">Connect wallets to establish account context. Balance readers remain separately gated per chain.</p>';
}

$('pairSearch').addEventListener('input', renderPairs);
$('ecosystemFilter').addEventListener('change', renderPairs);
$('quoteFilter').addEventListener('change', renderPairs);
$('terminalVenue').addEventListener('change', loadMarket);
$('terminalInterval').addEventListener('change', loadMarket);
$('loadMarket').addEventListener('click', loadMarket);
$('requestRoute').addEventListener('click', requestRoute);
window.addEventListener('beforeunload', () => marketData.closeAll());
setInterval(renderPortfolio, 5000);
renderPairs();
renderPortfolio();
loadMarket();

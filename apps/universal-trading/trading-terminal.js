import { MarketDataService } from './market-data.js';
import { LiveTradingChart } from './live-chart.js';

const root = document.querySelector('main.shell');
const section = document.createElement('section');
section.className = 'panel terminal-panel';
section.innerHTML = `
  <div class="panel-header"><div><h2>PARALLAX Live Trading Terminal</h2><span>public market data · governed execution boundary</span></div><span id="feedStatus" class="pill">disconnected</span></div>
  <div class="terminal-toolbar">
    <label>Venue<select id="terminalVenue"><option value="binance">Binance public feed</option><option value="coinbase">Coinbase public feed</option></select></label>
    <label>Pair<input id="terminalPair" value="BTCUSDT" list="popularPairs" /></label>
    <datalist id="popularPairs"><option>BTCUSDT</option><option>ETHUSDT</option><option>SOLUSDT</option><option>BNBUSDT</option><option>XRPUSDT</option><option>BTC-USD</option><option>ETH-USD</option><option>SOL-USD</option></datalist>
    <label>Interval<select id="terminalInterval"><option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option></select></label>
    <button id="loadMarket" type="button">Load live market</button>
  </div>
  <div class="terminal-layout">
    <div class="chart-shell"><canvas id="liveTradingChart"></canvas></div>
    <aside class="terminal-tape"><h3>Live tape</h3><div id="liveTape"></div></aside>
  </div>
  <div class="terminal-footer"><strong id="lastPrice">—</strong><span id="marketMeta">Choose a public feed. Live data does not enable live trading.</span></div>`;
root.prepend(section);

const marketData = new MarketDataService();
const chart = new LiveTradingChart(section.querySelector('#liveTradingChart'));
let stopFeed = null;

const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 10 });
function pushTrade(trade) {
  chart.updateFromTrade(trade);
  section.querySelector('#lastPrice').textContent = `${trade.pair} ${format(trade.price)}`;
  const tape = section.querySelector('#liveTape');
  const row = document.createElement('div');
  row.className = `tape-row ${trade.side || ''}`;
  row.innerHTML = `<strong>${format(trade.price)}</strong><span>${format(trade.quantity)}</span><time>${new Date(trade.time).toLocaleTimeString()}</time>`;
  tape.prepend(row);
  while (tape.children.length > 40) tape.lastElementChild.remove();
}

async function loadMarket() {
  const venue = section.querySelector('#terminalVenue').value;
  const pairInput = section.querySelector('#terminalPair').value.trim().toUpperCase();
  const pair = venue === 'coinbase' && !pairInput.includes('-') ? pairInput.replace(/(USD|USDC|USDT)$/, '-$1') : pairInput;
  const interval = section.querySelector('#terminalInterval').value;
  const status = section.querySelector('#feedStatus');
  status.textContent = 'loading';
  if (stopFeed) stopFeed();
  try {
    const candles = await marketData.candles({ venue, pair, interval, limit: 300 });
    chart.setData(candles);
    stopFeed = marketData.subscribeTrades({ venue, pair, onTrade: pushTrade, onStatus: (event) => { status.textContent = event.status; } });
    section.querySelector('#marketMeta').textContent = `${venue} · ${pair} · ${interval} · ${candles.length} candles · public market data`;
  } catch (error) {
    status.textContent = 'error';
    section.querySelector('#marketMeta').textContent = error.message;
  }
}

section.querySelector('#loadMarket').addEventListener('click', loadMarket);
window.addEventListener('beforeunload', () => marketData.closeAll());
loadMarket();

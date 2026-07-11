const DEFAULT_INTERVAL = '1m';

export class MarketDataService {
  constructor({ fetchImpl = fetch, WebSocketImpl = WebSocket, now = () => Date.now() } = {}) {
    this.fetch = fetchImpl;
    this.WebSocket = WebSocketImpl;
    this.now = now;
    this.subscriptions = new Map();
  }

  normalizePair(pair) {
    return String(pair || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  async candles({ venue = 'binance', pair, interval = DEFAULT_INTERVAL, limit = 300 }) {
    const symbol = this.normalizePair(pair);
    if (!symbol) throw new Error('pair_required');
    if (venue === 'binance') {
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${Math.min(limit, 1000)}`;
      const response = await this.fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`binance_candles_${response.status}`);
      const rows = await response.json();
      return rows.map((row) => ({ time: Math.floor(Number(row[0]) / 1000), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) }));
    }
    if (venue === 'coinbase') {
      const product = String(pair).toUpperCase().replace('/', '-');
      const granularity = ({ '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '6h': 21600, '1d': 86400 })[interval] || 60;
      const response = await this.fetch(`https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/candles?granularity=${granularity}`, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`coinbase_candles_${response.status}`);
      const rows = await response.json();
      return rows.map((row) => ({ time: Number(row[0]), low: Number(row[1]), high: Number(row[2]), open: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })).sort((a, b) => a.time - b.time).slice(-limit);
    }
    throw new Error('unsupported_market_data_venue');
  }

  subscribeTrades({ venue = 'binance', pair, onTrade, onStatus = () => {} }) {
    const key = `${venue}:${pair}`;
    this.unsubscribe(key);
    const socket = venue === 'binance'
      ? new this.WebSocket(`wss://stream.binance.com:9443/ws/${this.normalizePair(pair).toLowerCase()}@trade`)
      : new this.WebSocket('wss://advanced-trade-ws.coinbase.com');
    socket.addEventListener('open', () => {
      onStatus({ status: 'open', venue, pair });
      if (venue === 'coinbase') socket.send(JSON.stringify({ type: 'subscribe', channel: 'market_trades', product_ids: [String(pair).toUpperCase().replace('/', '-')] }));
    });
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (venue === 'binance') onTrade({ venue, pair, price: Number(data.p), quantity: Number(data.q), side: data.m ? 'sell' : 'buy', time: Number(data.T), tradeId: String(data.t) });
        else for (const item of data.events || []) for (const trade of item.trades || []) onTrade({ venue, pair, price: Number(trade.price), quantity: Number(trade.size), side: trade.side?.toLowerCase(), time: Date.parse(trade.time), tradeId: String(trade.trade_id) });
      } catch (error) { onStatus({ status: 'decode_error', error: error.message }); }
    });
    socket.addEventListener('close', () => onStatus({ status: 'closed', venue, pair }));
    socket.addEventListener('error', () => onStatus({ status: 'error', venue, pair }));
    this.subscriptions.set(key, socket);
    return () => this.unsubscribe(key);
  }

  unsubscribe(key) {
    const socket = this.subscriptions.get(key);
    if (socket) socket.close();
    this.subscriptions.delete(key);
  }

  closeAll() {
    for (const key of [...this.subscriptions.keys()]) this.unsubscribe(key);
  }
}

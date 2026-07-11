export class LiveTradingChart {
  constructor(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('canvas_required');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.candles = [];
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(canvas);
  }

  setData(candles) {
    this.candles = [...candles].slice(-300);
    this.render();
  }

  updateFromTrade(trade) {
    const bucket = Math.floor(Number(trade.time) / 60000) * 60;
    const price = Number(trade.price);
    const latest = this.candles[this.candles.length - 1];
    if (!latest || latest.time !== bucket) this.candles.push({ time: bucket, open: price, high: price, low: price, close: price, volume: Number(trade.quantity || 0) });
    else {
      latest.high = Math.max(latest.high, price);
      latest.low = Math.min(latest.low, price);
      latest.close = price;
      latest.volume += Number(trade.quantity || 0);
    }
    if (this.candles.length > 300) this.candles.shift();
    this.render();
  }

  render() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(320, this.canvas.clientWidth || 900);
    const height = Math.max(260, this.canvas.clientHeight || 460);
    this.canvas.width = Math.floor(width * ratio);
    this.canvas.height = Math.floor(height * ratio);
    const ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#07111f'; ctx.fillRect(0, 0, width, height);
    if (!this.candles.length) { ctx.fillStyle = '#94a3b8'; ctx.font = '14px system-ui'; ctx.fillText('Select a supported pair to load live market data.', 20, 36); return; }
    const pad = { left: 14, right: 68, top: 18, bottom: 30 };
    const lows = this.candles.map((c) => c.low); const highs = this.candles.map((c) => c.high);
    let min = Math.min(...lows); let max = Math.max(...highs); const range = Math.max(max - min, max * 0.002, 1e-8); min -= range * 0.08; max += range * 0.08;
    const plotW = width - pad.left - pad.right; const plotH = height - pad.top - pad.bottom;
    ctx.strokeStyle = 'rgba(148,163,184,.13)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) { const y = pad.top + (plotH * i / 5); ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke(); const value = max - ((max - min) * i / 5); ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-monospace'; ctx.fillText(value.toPrecision(7), width - pad.right + 7, y + 4); }
    const step = plotW / this.candles.length; const bodyW = Math.max(1, Math.min(10, step * .68));
    const yFor = (value) => pad.top + ((max - value) / (max - min)) * plotH;
    this.candles.forEach((candle, index) => { const x = pad.left + index * step + step / 2; const up = candle.close >= candle.open; ctx.strokeStyle = up ? '#22c55e' : '#ef4444'; ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(x, yFor(candle.high)); ctx.lineTo(x, yFor(candle.low)); ctx.stroke(); const top = Math.min(yFor(candle.open), yFor(candle.close)); const bodyH = Math.max(1, Math.abs(yFor(candle.close) - yFor(candle.open))); ctx.fillRect(x - bodyW / 2, top, bodyW, bodyH); });
  }

  destroy() { this.resizeObserver.disconnect(); }
}

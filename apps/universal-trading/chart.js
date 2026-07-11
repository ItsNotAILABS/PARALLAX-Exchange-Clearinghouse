export class CandlestickChart {
  constructor(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('canvas_required');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = [];
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
  }

  setData(data) {
    this.data = Array.isArray(data) ? data
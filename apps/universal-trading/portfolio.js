export class PortfolioEngine {
  constructor({ priceResolver = null, storage = globalThis.localStorage, storageKey = 'parallax.paper.portfolio.v1' } = {}) {
    this.priceResolver = priceResolver;
    this.storage = storage;
    this.storageKey = storageKey;
    this.snapshots = new Map();
    this.paperBalances = new Map();
    this.loadPaperLedger();
  }

  loadPaperLedger() {
    try {
      const rows = JSON.parse(this.storage?.getItem(this.storageKey) || '[]');
export class WalletAdapterRegistry {
  constructor({ win = globalThis.window, walletConfig = null } = {}) {
    if (!win?.addEventListener || !win?.dispatchEvent) throw new Error('browser_window_required');
    this.win = win;
    this.walletConfig = walletConfig;
    this.evmProviders = [];
    this.connections = new Map();
    this.installEip6963();
  }


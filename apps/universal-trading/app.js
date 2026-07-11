const state = {
  chains: null,
  wallets: null,
  assets: null,
  agents: null,
  evmProviders: [],
  connected: []
};

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function boot() {
  [state.chains, state.wallets, state.assets, state.agents] = await Promise.all([
    loadJson('../../config/chains/parallax.chain-registry
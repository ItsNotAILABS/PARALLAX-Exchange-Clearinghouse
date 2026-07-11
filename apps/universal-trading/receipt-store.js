const encoder = new TextEncoder();

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class SovereignReceiptStore {
  constructor({ storage = globalThis.localStorage, key = 'parallax.sovereign.receipts.v1', now = () => Date.now() } = {}) {
    this.storage = storage;
    this.key = key;
    this.now = now;
    this.receipts = this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(this.storage?.getItem(this.key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  persist() {
    this.storage?.setItem(this.key, JSON.stringify(this.receipts));
  }

  async append(kind, payload, metadata = {}) {
    const previous = this.receipts.at(-1) || null;
    const receipt = {
      receiptId: crypto.randomUUID(),
      sequence: this.receipts.length + 1,
      kind,
      createdAt: this.now(),
      previousHash: previous?.hash || null,
      payload,
      metadata: {
        platform: 'PARALLAX',
        executionBoundary: 'paper_testnet_only',
        ...metadata
      }
    };
    receipt.hash = await sha256(JSON.stringify(receipt));
    this.receipts.push(receipt);
    this.persist();
    return structuredClone(receipt);
  }

  list({ limit = 200, kind = null } = {}) {
    const source = kind ? this.receipts.filter((receipt) => receipt.kind === kind) : this.receipts;
    return structuredClone(source.slice(-Math.max(1, limit)).reverse());
  }

  async verify() {
    const failures = [];
    for (let index = 0; index < this.receipts.length; index += 1) {
      const receipt = this.receipts[index];
      const expectedPrevious = index === 0 ? null : this.receipts[index - 1].hash;
      const unsigned = { ...receipt };
      delete unsigned.hash;
      const computed = await sha256(JSON.stringify(unsigned));
      if (receipt.previousHash !== expectedPrevious) failures.push({ sequence: receipt.sequence, error: 'previous_hash_mismatch' });
      if (receipt.hash !== computed) failures.push({ sequence: receipt.sequence, error: 'receipt_hash_mismatch' });
    }
    return { ok: failures.length === 0, count: this.receipts.length, headHash: this.receipts.at(-1)?.hash || null, failures };
  }

  exportBundle() {
    return {
      schema: 'parallax.sovereign_receipt_bundle.v1',
      exportedAt: this.now(),
      receiptCount: this.receipts.length,
      headHash: this.receipts.at(-1)?.hash || null,
      receipts: structuredClone(this.receipts)
    };
  }
}
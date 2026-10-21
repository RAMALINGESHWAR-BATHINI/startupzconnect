// Verifies the cross-tab consent handshake used by the register wizard.
// Run with: node --experimental-strip-types scripts/verify-consent.mjs
import assert from 'node:assert/strict';

// Minimal localStorage shim so the real source module can be imported.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  },
};

const { markLegalDocRead, getLegalDocsRead, clearLegalDocsRead } =
  await import('../src/lib/legal-consent.ts');

// 1. Nothing read initially -> checkbox stays locked.
assert.deepEqual(getLegalDocsRead(), { terms: false, privacy: false });
console.log('PASS  initial state: both documents locked');

// 2. Opening only the Terms page unlocks only terms.
markLegalDocRead('terms');
assert.deepEqual(getLegalDocsRead(), { terms: true, privacy: false });
console.log('PASS  after visiting /terms only: terms unlocked, privacy still locked');

// 3. Opening the Privacy page unlocks both -> checkbox can be ticked.
markLegalDocRead('privacy');
assert.deepEqual(getLegalDocsRead(), { terms: true, privacy: true });
console.log('PASS  after visiting /privacy: both unlocked, agreement box enabled');

// 4. Registering clears the read-state.
clearLegalDocsRead();
assert.deepEqual(getLegalDocsRead(), { terms: false, privacy: false });
console.log('PASS  after successful registration: read-state cleared');

console.log('\nAll consent handshake checks passed.');

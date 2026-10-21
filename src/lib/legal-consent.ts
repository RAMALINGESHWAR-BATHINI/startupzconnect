/**
 * Tracks which legal documents a user has actually opened.
 *
 * The register form only lets a user tick "I have read and agree" after they
 * have genuinely loaded /terms and /privacy. The reading happens in a separate
 * tab, so the signal is carried through localStorage (shared across tabs of the
 * same origin) and picked up by the `storage` event in the registering tab.
 */

export const LEGAL_DOCS = ['terms', 'privacy'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

const STORAGE_KEY = (doc: LegalDoc) => `szc:legal-read:${doc}`;

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Called by the document page itself once it has actually rendered. */
export function markLegalDocRead(doc: LegalDoc): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY(doc), new Date().toISOString());
  } catch {
    // storage disabled or full — the visit simply is not recorded
  }
}

/** Reads the current read-state of both documents. */
export function getLegalDocsRead(): Record<LegalDoc, boolean> {
  const store = safeStorage();
  const result: Record<LegalDoc, boolean> = { terms: false, privacy: false };
  if (!store) return result;
  try {
    for (const doc of LEGAL_DOCS) {
      result[doc] = store.getItem(STORAGE_KEY(doc)) !== null;
    }
  } catch {
    // ignore and treat as not read
  }
  return result;
}

/** Clears the read-state, e.g. after a successful registration. */
export function clearLegalDocsRead(): void {
  const store = safeStorage();
  if (!store) return;
  try {
    for (const doc of LEGAL_DOCS) store.removeItem(STORAGE_KEY(doc));
  } catch {
    // ignore
  }
}

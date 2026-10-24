export const LEGAL_DOCS = ['terms', 'privacy'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

const STORAGE_KEY = (attemptId: string, doc: LegalDoc) => `szc:legal-read:${attemptId}:${doc}`;

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function markLegalDocRead(doc: LegalDoc, attemptId: string): void {
  const store = safeStorage();
  if (!store || !attemptId) return;
  try { store.setItem(STORAGE_KEY(attemptId, doc), new Date().toISOString()); } catch {}
}

export function getLegalDocsRead(attemptId: string): Record<LegalDoc, boolean> {
  const result: Record<LegalDoc, boolean> = { terms: false, privacy: false };
  if (!attemptId) return result;
  const store = safeStorage();
  if (!store) return result;
  try {
    for (const doc of LEGAL_DOCS) {
      result[doc] = store.getItem(STORAGE_KEY(attemptId, doc)) !== null;
    }
  } catch {}
  return result;
}

export function clearLegalDocsRead(attemptId: string): void {
  if (!attemptId) return;
  const store = safeStorage();
  if (!store) return;
  try {
    for (const doc of LEGAL_DOCS) store.removeItem(STORAGE_KEY(attemptId, doc));
  } catch {}
}

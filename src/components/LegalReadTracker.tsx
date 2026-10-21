'use client';
import { useEffect } from 'react';
import { markLegalDocRead, type LegalDoc } from '@/lib/legal-consent';

/**
 * Mounted inside /terms and /privacy. Records that the document was actually
 * rendered for this user, which is what unlocks the agreement checkbox on the
 * registration form.
 */
export default function LegalReadTracker({ doc }: { doc: LegalDoc }) {
  useEffect(() => {
    markLegalDocRead(doc);
  }, [doc]);

  return null;
}

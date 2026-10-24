'use client';
import { useEffect } from 'react';
import { markLegalDocRead, type LegalDoc } from '@/lib/legal-consent';

export default function LegalReadTracker({ doc }: { doc: LegalDoc }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get('attempt') || '';
    if (attemptId) markLegalDocRead(doc, attemptId);
  }, [doc]);
  return null;
}

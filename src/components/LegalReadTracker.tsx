'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { markLegalDocRead, type LegalDoc } from '@/lib/legal-consent';

export default function LegalReadTracker({ doc }: { doc: LegalDoc }) {
  const params = useSearchParams();
  const attemptId = params.get('attempt') || '';
  useEffect(() => {
    if (attemptId) markLegalDocRead(doc, attemptId);
  }, [doc, attemptId]);
  return null;
}

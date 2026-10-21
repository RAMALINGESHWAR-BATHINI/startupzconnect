'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side render errors — logged for now; wire to a client-side
    // alert endpoint later if these turn out to be frequent.
    console.error('Unhandled client error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-slate-400 max-w-sm">An unexpected error occurred. Our team has been notified.</p>
        <div className="flex gap-3 mt-2">
          <button onClick={reset} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">Try Again</button>
          <Link href="/" className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium">Go Home</Link>
        </div>
      </body>
    </html>
  );
}

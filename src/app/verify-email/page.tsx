'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found in the link.'); return; }
    api.post('/auth/verify-email', { token })
      .then(res => { setStatus('success'); setMessage(res.data.message); })
      .catch(err => { setStatus('error'); setMessage(err?.response?.data?.error || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
      {status === 'loading' && (<>
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
        <p className="text-slate-400">Verifying your email...</p>
      </>)}
      {status === 'success' && (<>
        <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
        <p className="text-slate-400 max-w-sm">{message}</p>
        <button onClick={() => router.push('/login')} className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
          Continue to Log In
        </button>
      </>)}
      {status === 'error' && (<>
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
        <p className="text-slate-400 max-w-sm">{message}</p>
        <Link href="/dashboard/settings" className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2">
          <Mail className="w-4 h-4" /> Request a New Link
        </Link>
      </>)}
    </div>
  );
}

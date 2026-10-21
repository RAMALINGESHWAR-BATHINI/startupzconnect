'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot your password?</h1>
          <p className="text-slate-400 mt-1 text-sm">We'll email you a link to reset it.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-white font-medium">Check your email</p>
              <p className="text-sm text-slate-400">If an account exists for <span className="text-white">{email}</span>, a reset link is on its way. It expires in 1 hour.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@startup.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

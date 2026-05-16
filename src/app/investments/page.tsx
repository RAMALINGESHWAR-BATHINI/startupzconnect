'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Loader2, ArrowLeft, Building2 } from 'lucide-react';

export default function InvestmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ startupId: '', amount: '', message: '' });
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get('/startups', { params: { limit: 100 } })
      .then(res => setStartups(res.data.startups || []))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(''); setSubmitting(true);
    try {
      await api.post('/investments', { startupId: parseInt(form.startupId), amount: form.amount, message: form.message });
      setFeedback('✅ Investment interest submitted successfully!');
      setForm({ startupId: '', amount: '', message: '' });
    } catch (err: any) {
      setFeedback(`❌ ${err?.response?.data?.error || 'Failed to submit.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-4">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Express Investment Interest</h1>
        <p className="text-slate-400 text-sm mt-1">Let founders know you&apos;re interested in backing them.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {feedback && (
            <p className={`px-4 py-3 rounded-lg text-sm border ${feedback.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {feedback}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Startup *</label>
            {loading ? <div className="flex items-center gap-2 text-slate-500 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div> : (
              <select required value={form.startupId} onChange={e => setForm({ ...form, startupId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm transition-colors">
                <option value="">Choose a startup</option>
                {startups.map(s => <option key={s.id} value={s.id}>{s.name} — {s.domain || 'General'}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Investment Amount (USD, optional)</label>
            <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 50000"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Message / Thesis</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
              placeholder="Why are you interested? What can you bring?"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm resize-none transition-colors" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Interest'}
          </button>
        </form>
      </div>
    </div>
  );
}

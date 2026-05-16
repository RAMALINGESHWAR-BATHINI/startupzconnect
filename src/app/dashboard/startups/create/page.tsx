'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const DOMAINS = ['AI', 'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-commerce', 'Logistics', 'CleanTech', 'GameTech', 'Other'];

export default function CreateStartupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', domain: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/startups', form);
      router.push(`/startups/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create startup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Launch your Startup</h1>
        <p className="text-slate-400 text-sm mt-1">List your startup to attract talent and investors.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Startup Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. NeuralMed AI"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Domain / Industry</label>
            <select value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm transition-colors">
              <option value="">Select a domain</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5}
              placeholder="What does your startup do? What problem does it solve?"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Startup'}
          </button>
        </form>
      </div>
    </div>
  );
}

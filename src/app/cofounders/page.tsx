'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Users, Loader2, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

const COMMITMENTS = ['Full-time', 'Part-time', 'Weekends'];
const DOMAINS = ['','AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];

export default function CofoundersPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ lookingFor: '', skillsOffered: '', skillsWanted: '', commitment: 'Full-time', domain: '', pitch: '' });

  const fetchListings = useCallback(() => {
    setLoading(true);
    api.get('/cofounders', { params: { domain: domainFilter } })
      .then(r => setListings(r.data || []))
      .finally(() => setLoading(false));
  }, [domainFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    setError(''); setSubmitting(true);
    try {
      await api.post('/cofounders', form);
      setSuccess(true);
      setShowForm(false);
      fetchListings();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to post listing.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Find a Co-founder</h1>
          <p className="text-slate-400">Technical founders looking for business partners, and vice versa.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors self-start">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Post a Listing</>}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />Your listing is live!
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] mb-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="Looking for (e.g. Technical Co-founder) *" value={form.lookingFor}
              onChange={e => setForm(f => ({ ...f, lookingFor: e.target.value }))}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
            <select value={form.commitment} onChange={e => setForm(f => ({ ...f, commitment: e.target.value }))}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none">
              {COMMITMENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required placeholder="Skills you offer (comma-separated) *" value={form.skillsOffered}
              onChange={e => setForm(f => ({ ...f, skillsOffered: e.target.value }))}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
            <input required placeholder="Skills you need (comma-separated) *" value={form.skillsWanted}
              onChange={e => setForm(f => ({ ...f, skillsWanted: e.target.value }))}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none sm:col-span-2">
              <option value="">Domain (optional)</option>
              {DOMAINS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <textarea required minLength={30} rows={4} placeholder="Describe your idea, stage, and what kind of partner you're looking for... *"
            value={form.pitch} onChange={e => setForm(f => ({ ...f, pitch: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none" />
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Listing'}
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-6">
        <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none">
          <option value="">All domains</option>
          {DOMAINS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : listings.length === 0 ? (
        <EmptyState icon={Users} title="No listings yet" sub="Be the first to post — founders looking for a co-founder will see it here." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {listings.map((l: any) => (
            <div key={l.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {l.user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{l.user?.name}</p>
                  <p className="text-xs text-slate-500">{l.commitment}{l.domain ? ` · ${l.domain}` : ''}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-indigo-300 mb-2">Looking for: {l.lookingFor}</p>
              <p className="text-sm text-slate-400 mb-4 line-clamp-3">{l.pitch}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {l.skillsOffered.split(',').map((s: string) => <span key={s} className="badge badge-green text-xs">Offers: {s.trim()}</span>)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {l.skillsWanted.split(',').map((s: string) => <span key={s} className="badge badge-purple text-xs">Needs: {s.trim()}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

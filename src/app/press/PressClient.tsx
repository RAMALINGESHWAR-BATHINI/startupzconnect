'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Newspaper, Loader2, Plus, X, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PressClient() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', domain: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = () => api.get('/press').then(r => setRequests(r.data || [])).finally(() => setLoading(false));
  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    setError(''); setSubmitting(true);
    try {
      await api.post('/press', form);
      setShowForm(false); setForm({ title: '', description: '', domain: '' });
      fetchRequests();
    } catch (err: any) { setError(err?.response?.data?.error || 'Failed to post request.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Press & Media Requests</h1>
          <p className="text-slate-400">Journalists looking for startup stories. Free visibility for the startups that respond.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold self-start">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Post a Request</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] mb-8 space-y-4">
          {error && <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
          <input required placeholder="e.g. Looking for a HealthTech startup in Bangalore for a feature" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
          <textarea required rows={4} placeholder="What are you writing about? What kind of startup fits?" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none" />
          <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Post Request'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={Newspaper} title="No open press requests" sub="Journalists can post what they're looking for here." />
      ) : (
        <div className="space-y-4">
          {requests.map((r: any) => (
            <div key={r.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <p className="font-semibold text-white mb-2">{r.title}</p>
              <p className="text-sm text-slate-400 mb-3">{r.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Posted by {r.user?.name}</span>
                <span>{r._count?.responses || 0} responses</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

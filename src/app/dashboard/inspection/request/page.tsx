'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ClipboardList, Loader2, ArrowLeft, AlertCircle, CheckCircle, Shield } from 'lucide-react';

const TIERS = [
  { value: 'BASIC',    label: 'Basic Inspection',   price: '₹1,000', features: ['Office visit','Full report','Field Verified badge'] },
  { value: 'PREMIUM',  label: 'Premium Inspection',  price: '₹3,000', features: ['Office visit','Full report','Field Verified badge','Full photo set','Product showcase','Video walkthrough'] },
];

export default function RequestInspectionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myStartups, setMyStartups] = useState<any[]>([]);
  const [form, setForm] = useState({ startupId: '', tier: 'BASIC', preferredDate: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/startups', { params: { limit: 50 } })
      .then(r => {
        const mine = (r.data.startups || []).filter((s: any) => s.founder?.id === user.id);
        setMyStartups(mine);
        if (mine.length === 1) setForm(f => ({ ...f, startupId: String(mine[0].id) }));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startupId) { setError('Please select a startup.'); return; }
    setError(''); setSubmitting(true);
    try {
      await api.post('/inspections', {
        startupId: parseInt(form.startupId),
        tier: form.tier,
        preferredDate: form.preferredDate || undefined,
        notes: form.notes,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit request.');
    } finally { setSubmitting(false); }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center mb-2">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">Inspection Requested!</h2>
      <p className="text-slate-400 max-w-sm">Our team will review your request and assign a Field Agent in your city. You'll hear from us within 48 hours.</p>
      <button onClick={() => router.push('/dashboard')}
        className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Request Field Inspection</h1>
          <p className="text-slate-400 text-sm">Get your startup physically verified by a StartupzConnect agent.</p>
        </div>
      </div>

      {/* What happens */}
      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 mb-8">
        <p className="text-sm font-semibold text-indigo-300 mb-3">What happens after you submit:</p>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>Our team reviews your request within 48 hours</li>
          <li>A Field Agent in your city is assigned</li>
          <li>Agent contacts you to schedule a 2-hour visit window</li>
          <li>Agent visits, documents, and files a report</li>
          <li>Report reviewed by our team → badge applied to your profile</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
          {myStartups.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Startup *</label>
              <select value={form.startupId} onChange={e => setForm(f => ({ ...f, startupId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm transition-colors">
                <option value="">Choose a startup</option>
                {myStartups.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {myStartups.length === 0 && (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-3">You need to create a startup first before requesting inspection.</p>
              <button onClick={() => router.push('/dashboard/startups/create')} type="button"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">Create Startup</button>
            </div>
          )}

          {/* Tier selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Inspection Package *</label>
            <div className="space-y-3">
              {TIERS.map(t => (
                <label key={t.value} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  form.tier === t.value ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'
                }`}>
                  <input type="radio" name="tier" value={t.value} checked={form.tier === t.value}
                    onChange={() => setForm(f => ({ ...f, tier: t.value }))} className="mt-1 accent-indigo-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{t.label}</p>
                      <p className="text-sm font-bold text-indigo-400">{t.price}</p>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {t.features.map(f => (
                        <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Preferred Visit Date (optional)</label>
            <input type="date" value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
              min={new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
            <p className="text-xs text-slate-500 mt-1">Minimum 3 days from today. Agent will confirm availability.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes for Agent (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              placeholder="Any access instructions, parking info, or things to highlight during the visit..."
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors" />
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Payment is collected separately before the visit is confirmed. By submitting you agree to the inspection policy.
        </p>

        <button type="submit" disabled={submitting || myStartups.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold transition-colors">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><ClipboardList className="w-4 h-4" /> Submit Inspection Request</>}
        </button>
      </form>
    </div>
  );
}

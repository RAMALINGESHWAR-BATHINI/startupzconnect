'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Building, Plus, X } from 'lucide-react';

export default function AdminInstitutionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', contactEmail: '', city: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.push('/dashboard');
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const fetchPartners = () => api.get('/admin/institutions').then(r => setPartners(r.data || [])).finally(() => setLoading(false));
  useEffect(() => { fetchPartners(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try { await api.post('/admin/institutions', form); setForm({ name: '', contactName: '', contactEmail: '', city: '' }); setShowForm(false); fetchPartners(); }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center"><Building className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Institution Partners</h1>
            <p className="text-slate-400 text-sm">Incubators/accelerators whose cohorts onboard in bulk.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? 'Cancel' : 'Add Partner'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Institution name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm sm:col-span-2" />
          <input placeholder="Contact name" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm" />
          <input placeholder="Contact email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm" />
          <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm sm:col-span-2" />
          <button type="submit" disabled={submitting} className="sm:col-span-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Partner'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {partners.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div>
              <p className="font-medium text-white">{p.name}</p>
              <p className="text-xs text-slate-500">{p.city || 'No city'} · {p.contactName || 'No contact'}</p>
            </div>
            <span className="badge badge-purple">{p._count?.startups || 0} startups</span>
          </div>
        ))}
      </div>
    </div>
  );
}

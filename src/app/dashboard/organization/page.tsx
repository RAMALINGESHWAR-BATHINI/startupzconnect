'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader2, Save } from 'lucide-react';

export default function OrganizationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchOrg = async () => {
    try {
      const res = await api.get('/me/organization');
      setOrg(res.data);
      setName(res.data.name || '');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ORGANIZATION') {
      setLoading(false);
      return;
    }
    fetchOrg();
  }, [authLoading, user]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/me/organization', { name });
      setSaved(true);
      await fetchOrg();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
  if (!user || user.role !== 'ORGANIZATION') return <div className="max-w-4xl mx-auto px-4 py-12 text-white">Access denied</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Organization Dashboard</h1>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {org ? (
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white" />
          </div>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          {saved && <div className="text-emerald-400 text-sm">Saved</div>}
        </div>
      ) : (
        <div className="text-slate-400">No organization linked.</div>
      )}
    </div>
  );
}

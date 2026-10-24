'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ClaimPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/startups/${id}/claim`);
      setClaims(res.data || []);
    } catch { setClaims([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMsg('');
    try {
      await api.post(`/startups/${id}/claim`, { reason, evidenceNote: note });
      setMsg('Claim submitted. Status: PENDING.');
      setReason(''); setNote('');
      load();
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Failed to submit claim.');
    } finally { setSubmitting(false); }
  };

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-12 text-slate-400">Please log in to claim this profile.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Claim organization profile</h1>
      <p className="text-slate-400 mb-6">Submitting a claim does not transfer ownership or verify the organization. Claims are reviewed by administrators.</p>

      <form onSubmit={submit} className="space-y-4 mb-10">
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason (min 10 chars)" className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/10 text-white" rows={4} />
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Evidence note (optional)" className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/10 text-white" rows={3} />
        <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit claim'}
        </button>
        {msg && <p className="text-sm text-slate-300">{msg}</p>}
      </form>

      <h2 className="text-xl font-semibold text-white mb-4">Your claims</h2>
      {loading ? <p className="text-slate-400">Loading...</p> : claims.length === 0 ? <p className="text-slate-400">No claims yet.</p> : (
        <ul className="space-y-3">
          {claims.map(c => (
            <li key={c.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Claim #{c.id}</span>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{c.status}</span>
              </div>
              <p className="text-sm text-slate-400">Submitted {new Date(c.createdAt).toLocaleString()}</p>
              {c.decisionNote && <p className="text-sm text-slate-300 mt-2">Reviewer feedback: {c.decisionNote}</p>}
              {c.status === 'APPROVED' && <p className="text-xs text-amber-400 mt-2">Approved claim decision only. Ownership transfer requires separate authorized process.</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
